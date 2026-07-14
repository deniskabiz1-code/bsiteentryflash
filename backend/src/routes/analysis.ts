import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import {
  findOrCreateUser,
  isSubscriptionActive,
  notifyAdminAnalysisSubmission,
} from '../services/telegram';
import { hasTelegramUsedFreeTrial, markTelegramFreeTrialUsed } from '../services/freeTrial';
import { toFaceHistoryEntry } from '../services/analysisHistory';
import {
  analyzeFace,
  analyzeHairstyle,
  generateHairstylePreview,
} from '../services/openai';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

const router = Router();

function sanitizeFaceResultForClient<T extends Record<string, unknown>>(
  result: T,
  subscribed: boolean,
): T {
  if (subscribed || !('skincare_routine' in result)) return result;
  const { skincare_routine: _removed, ...rest } = result;
  return rest as T;
}

function sanitizeAnalysisRecord(
  analysis: {
    id: number;
    type: string;
    photoUrl: string;
    overallScore: number | null;
    resultJson: unknown;
    createdAt: Date;
  },
  subscribed: boolean,
) {
  if (analysis.type !== 'face' || subscribed) return analysis;
  const resultJson = analysis.resultJson as Record<string, unknown>;
  return {
    ...analysis,
    resultJson: sanitizeFaceResultForClient(resultJson, false),
  };
}

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function guessImageMime(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function readPhotoBytes(filePath: string): Uint8Array | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const bytes = fs.readFileSync(filePath);
    return bytes.length > 0 ? Uint8Array.from(bytes) : null;
  } catch {
    return null;
  }
}

function toPhotoPayload(filePath: string, filename: string): { buffer: Uint8Array; filename: string } | null {
  const bytes = readPhotoBytes(filePath);
  if (!bytes) return null;
  return { buffer: bytes, filename };
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname) || '.jpg'}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const ext = path.extname(file.originalname).toLowerCase();
    const okMime = allowed.includes(file.mimetype);
    const okExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(ext);
    if (okMime || okExt || file.mimetype === 'application/octet-stream') {
      cb(null, true);
      return;
    }
    cb(new Error('Неподдерживаемый формат фото. Используйте JPEG, PNG или HEIC'));
  },
});

async function canPerformAnalysis(
  userId: number,
  telegramId: bigint,
  subscriptionEnd: Date | null,
  referralCredits: number,
  type: 'face' | 'hairstyle'
): Promise<{ allowed: boolean; useCredit: boolean; reason?: string }> {
  if (isSubscriptionActive(subscriptionEnd)) {
    return { allowed: true, useCredit: false };
  }

  if (type === 'face') {
    const count = await prisma.analysis.count({
      where: { userId, type: 'face' },
    });
    if (count === 0 && !(await hasTelegramUsedFreeTrial(telegramId))) {
      return { allowed: true, useCredit: false };
    }
  }

  if (referralCredits > 0) {
    return { allowed: true, useCredit: true };
  }

  return {
    allowed: false,
    useCredit: false,
    reason: 'Бесплатный анализ уже использован. Нужна подписка или реферальные кредиты',
  };
}

router.post(
  '/face',
  validateTelegramAuth,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Загрузите фото' });
        return;
      }

      const user = await findOrCreateUser(req.telegramUser!);
      const access = await canPerformAnalysis(
        user.id,
        user.telegramId,
        user.subscriptionEnd,
        user.referralCredits,
        'face'
      );

      if (!access.allowed) {
        fs.unlinkSync(req.file.path);
        res.status(403).json({ error: access.reason });
        return;
      }

      const priorFace = await prisma.analysis.findMany({
        where: { userId: user.id, type: 'face' },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { overallScore: true, resultJson: true, createdAt: true },
      });

      const { data: result, demo } = await analyzeFace(req.file.path, {
        name: user.name,
        age: user.age,
        goals: user.goals,
        previousAnalyses: priorFace.map((a) =>
          toFaceHistoryEntry(a.createdAt, a.overallScore, a.resultJson),
        ),
      });
      const overallScore = (result.overall_score as number) || 0;

      const photoBytes = readPhotoBytes(req.file.path);
      const analysis = await prisma.analysis.create({
        data: {
          userId: user.id,
          type: 'face',
          photoUrl: `/uploads/${req.file.filename}`,
          photoData: photoBytes ? (photoBytes as Uint8Array<ArrayBuffer>) : undefined,
          resultJson: result as Prisma.InputJsonValue,
          overallScore,
          demo,
        },
      });

      if (access.useCredit) {
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCredits: { decrement: 1 } },
        });
      } else if (!isSubscriptionActive(user.subscriptionEnd)) {
        await markTelegramFreeTrialUsed(user.telegramId);
      }

      const subscribed = isSubscriptionActive(user.subscriptionEnd);
      const clientResult = sanitizeFaceResultForClient(
        result as Record<string, unknown>,
        subscribed,
      );

      res.json({
        analysis: {
          id: analysis.id,
          ...clientResult,
          photoUrl: analysis.photoUrl,
          demo,
        },
      });

      const adminPhoto = toPhotoPayload(req.file.path, req.file.filename);
      if (adminPhoto) {
        notifyAdminAnalysisSubmission({
          type: 'face',
          analysisId: analysis.id,
          username: user.username,
          telegramId: user.telegramId,
          name: user.name,
          age: user.age,
          overallScore,
          photos: [adminPhoto],
        }).catch((err) => {
          console.error('[analysis] Admin notify failed:', err);
        });
      }
    } catch (err) {
      console.error('Face analysis error:', err);
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      const message = err instanceof Error ? err.message : 'Ошибка анализа лица';
      const status = message.includes('Неподдерживаемый формат') ? 400 : 500;
      res.status(status).json({ error: message.includes('Неподдерживаемый') ? message : 'Ошибка анализа лица' });
    }
  }
);

router.post(
  '/hairstyle',
  validateTelegramAuth,
  upload.fields([
    { name: 'frontPhoto', maxCount: 1 },
    { name: 'sidePhoto', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const front = files?.frontPhoto?.[0];
      const side = files?.sidePhoto?.[0];

      if (!front || !side) {
        res.status(400).json({ error: 'Загрузите фото анфас и в профиль' });
        return;
      }

      const user = await findOrCreateUser(req.telegramUser!);

      if (!isSubscriptionActive(user.subscriptionEnd)) {
        fs.unlinkSync(front.path);
        fs.unlinkSync(side.path);
        res.status(403).json({ error: 'Анализ причёски доступен по подписке' });
        return;
      }

      const { data: result, demo } = await analyzeHairstyle(front.path, side.path);

      const photoBytes = readPhotoBytes(front.path);
      const analysis = await prisma.analysis.create({
        data: {
          userId: user.id,
          type: 'hairstyle',
          photoUrl: `/uploads/${front.filename}`,
          photoData: photoBytes ? (photoBytes as Uint8Array<ArrayBuffer>) : undefined,
          sidePhotoUrl: `/uploads/${side.filename}`,
          resultJson: result as Prisma.InputJsonValue,
          demo,
        },
      });

      res.json({
        analysis: {
          id: analysis.id,
          ...result,
          photoUrl: analysis.photoUrl,
          demo,
        },
      });

      const adminPhotos = [
        toPhotoPayload(front.path, front.filename),
        toPhotoPayload(side.path, side.filename),
      ].filter((photo): photo is { buffer: Uint8Array; filename: string } => photo !== null);
      if (adminPhotos.length > 0) {
        notifyAdminAnalysisSubmission({
          type: 'hairstyle',
          analysisId: analysis.id,
          username: user.username,
          telegramId: user.telegramId,
          name: user.name,
          age: user.age,
          photos: adminPhotos,
        }).catch((err) => {
          console.error('[analysis] Admin notify failed:', err);
        });
      }
    } catch (err) {
      console.error('Hairstyle analysis error:', err);
      res.status(500).json({ error: 'Ошибка анализа причёски' });
    }
  }
);

router.post(
  '/hairstyle/try-on',
  validateTelegramAuth,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { hairstyleName } = req.body;
      if (!req.file || !hairstyleName) {
        res.status(400).json({ error: 'Загрузите фото и укажите причёску' });
        return;
      }

      const user = await findOrCreateUser(req.telegramUser!);
      if (!isSubscriptionActive(user.subscriptionEnd)) {
        fs.unlinkSync(req.file.path);
        res.status(403).json({ error: 'Примерка доступна по подписке' });
        return;
      }

      const previewUrl = await generateHairstylePreview(req.file.path, hairstyleName);

      res.json({
        previewUrl,
        placeholder: !previewUrl,
        message: previewUrl
          ? 'Превью сгенерировано'
          : 'Функция примерки скоро будет доступна',
      });

      const adminPhoto = toPhotoPayload(req.file.path, req.file.filename);
      if (adminPhoto) {
        notifyAdminAnalysisSubmission({
          type: 'try-on',
          username: user.username,
          telegramId: user.telegramId,
          name: user.name,
          age: user.age,
          hairstyleName: String(hairstyleName),
          photos: [adminPhoto],
        }).catch((err) => {
          console.error('[analysis] Admin notify failed:', err);
        });
      }
    } catch (err) {
      console.error('Try-on error:', err);
      res.status(500).json({ error: 'Ошибка генерации превью' });
    }
  }
);

router.get('/history', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const analyses = await prisma.analysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        photoUrl: true,
        overallScore: true,
        resultJson: true,
        createdAt: true,
      },
    });

    const subscribed = isSubscriptionActive(user.subscriptionEnd);
    res.json({
      analyses: analyses.map((a) => sanitizeAnalysisRecord(a, subscribed)),
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Ошибка загрузки истории' });
  }
});

router.get('/:id/photo', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const analysisId = parseInt(String(req.params.id), 10);
    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, userId: user.id },
    });

    if (!analysis) {
      res.status(404).json({ error: 'Анализ не найден' });
      return;
    }

    const mime = guessImageMime(analysis.photoUrl);
    const filePath = path.join(uploadDir, path.basename(analysis.photoUrl));
    if (fs.existsSync(filePath)) {
      res.type(mime);
      res.sendFile(path.resolve(filePath));
      return;
    }

    if (analysis.photoData && analysis.photoData.length > 0) {
      res.type(mime);
      res.send(Buffer.from(analysis.photoData.buffer, analysis.photoData.byteOffset, analysis.photoData.byteLength));
      return;
    }

    res.status(404).json({ error: 'Фото не найдено' });
  } catch (err) {
    console.error('Analysis photo error:', err);
    res.status(500).json({ error: 'Ошибка загрузки фото' });
  }
});

router.get('/:id', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const analysis = await prisma.analysis.findFirst({
      where: { id: parseInt(String(req.params.id), 10), userId: user.id },
    });

    if (!analysis) {
      res.status(404).json({ error: 'Анализ не найден' });
      return;
    }

    const subscribed = isSubscriptionActive(user.subscriptionEnd);
    res.json({ analysis: sanitizeAnalysisRecord(analysis, subscribed) });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки анализа' });
  }
});

router.delete('/:id', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const analysis = await prisma.analysis.findFirst({
      where: { id: parseInt(String(req.params.id), 10), userId: user.id },
    });

    if (!analysis) {
      res.status(404).json({ error: 'Анализ не найден' });
      return;
    }

    const photoPath = path.join(uploadDir, path.basename(analysis.photoUrl));
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);

    await prisma.analysis.delete({ where: { id: analysis.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

export default router;
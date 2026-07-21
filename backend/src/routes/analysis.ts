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
import { toFaceHistoryEntry } from '../services/analysisHistory';
import {
  analyzeFace,
  analyzeHairstyle,
  generateHairstylePreview,
} from '../services/openai';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { wantsPersonalizedAnalysis } from '../utils/booleanSetting';
import { enrichAnalysisInsights } from '../services/analysisInsights';
import {
  resolveAccessTier,
  resolveContentLevel,
  sanitizeFaceResultForClient,
} from '../utils/analysisAccess';

const router = Router();

function sanitizeAnalysisRecord(
  analysis: {
    id: number;
    type: string;
    photoUrl: string;
    overallScore: number | null;
    accessTier?: string | null;
    resultJson: unknown;
    createdAt: Date;
  },
  subscribed: boolean,
) {
  const contentLevel = resolveContentLevel(analysis.accessTier, subscribed);
  if (analysis.type !== 'face') {
    return { ...analysis, contentLevel };
  }
  const resultJson = enrichAnalysisInsights(analysis.resultJson as Record<string, unknown>);
  return {
    ...analysis,
    contentLevel,
    resultJson: sanitizeFaceResultForClient(resultJson, contentLevel),
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
      const subscribed = isSubscriptionActive(user.subscriptionEnd);
      // Referral credits are only spent via POST /:id/unlock — never auto on new runs
      const accessTier = resolveAccessTier(subscribed);
      const contentLevel = resolveContentLevel(accessTier, subscribed);
      const usePersonalized = accessTier === 'full' && wantsPersonalizedAnalysis(
        user.personalizedAnalysis,
        req.body?.personalized,
      );

      const priorFace = usePersonalized
        ? await prisma.analysis.findMany({
            where: { userId: user.id, type: 'face' },
            orderBy: { createdAt: 'desc' },
            take: 4,
            select: { overallScore: true, resultJson: true, createdAt: true },
          })
        : [];

      const { data: result, demo } = await analyzeFace(
        req.file.path,
        usePersonalized
          ? {
              name: user.name,
              age: user.age,
              goals: user.goals,
              previousAnalyses: priorFace.map((a) =>
                toFaceHistoryEntry(a.createdAt, a.overallScore, a.resultJson),
              ),
            }
          : undefined,
        accessTier === 'free' ? 'lite' : 'full',
      );
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
          accessTier,
          demo,
        },
      });

      const clientResult = sanitizeFaceResultForClient(
        result as Record<string, unknown>,
        contentLevel,
      );

      res.json({
        analysis: {
          id: analysis.id,
          ...clientResult,
          photoUrl: analysis.photoUrl,
          accessTier,
          contentLevel,
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
      if (message.includes('Неподдерживаемый формат')) {
        res.status(400).json({ error: message });
        return;
      }
      if (message.startsWith('ИИ ')) {
        res.status(503).json({ error: message });
        return;
      }
      res.status(500).json({ error: 'Ошибка анализа лица' });
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
          accessTier: 'full',
          demo,
        },
      });

      res.json({
        analysis: {
          id: analysis.id,
          ...result,
          photoUrl: analysis.photoUrl,
          accessTier: 'full',
          contentLevel: 'premium',
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
        accessTier: true,
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

function bytesToBuffer(data: Uint8Array | Buffer): Buffer {
  if (Buffer.isBuffer(data)) return data;
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}

/**
 * Spend 1 referral credit to re-run full AI on a past free (preview) face analysis.
 * Credit is charged only after AI succeeds so a failed unlock never burns a free credit.
 */
router.post('/:id/unlock', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  let tempPhotoPath: string | null = null;

  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const analysisId = parseInt(String(req.params.id), 10);

    if (Number.isNaN(analysisId)) {
      res.status(400).json({ error: 'Некорректный id' });
      return;
    }

    if (isSubscriptionActive(user.subscriptionEnd)) {
      res.status(400).json({ error: 'Подписка уже открывает полный разбор' });
      return;
    }

    if (user.referralCredits < 1) {
      res.status(403).json({
        error: 'Нет бесплатных полных анализов. Пригласите друга или оформите подписку.',
      });
      return;
    }

    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, userId: user.id, type: 'face' },
    });

    if (!analysis) {
      res.status(404).json({ error: 'Анализ не найден' });
      return;
    }

    if (analysis.accessTier === 'full') {
      res.status(400).json({ error: 'Этот анализ уже полный' });
      return;
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const diskPath = path.join(uploadDir, path.basename(analysis.photoUrl));
    let photoPath = diskPath;
    if (!fs.existsSync(diskPath)) {
      if (analysis.photoData && analysis.photoData.length > 0) {
        tempPhotoPath = path.join(uploadDir, `unlock-${analysis.id}-${Date.now()}.jpg`);
        fs.writeFileSync(tempPhotoPath, bytesToBuffer(analysis.photoData));
        photoPath = tempPhotoPath;
      } else {
        throw new Error('PHOTO_MISSING');
      }
    }

    const usePersonalized = wantsPersonalizedAnalysis(
      user.personalizedAnalysis,
      req.body?.personalized,
    );
    const priorFace = usePersonalized
      ? await prisma.analysis.findMany({
          where: {
            userId: user.id,
            type: 'face',
            id: { not: analysis.id },
          },
          orderBy: { createdAt: 'desc' },
          take: 4,
          select: { overallScore: true, resultJson: true, createdAt: true },
        })
      : [];

    // Full AI first (speed profile: low reasoning, short attempts) — credit only after success
    const { data: result, demo } = await analyzeFace(
      photoPath,
      usePersonalized
        ? {
            name: user.name,
            age: user.age,
            goals: user.goals,
            previousAnalyses: priorFace.map((a) =>
              toFaceHistoryEntry(a.createdAt, a.overallScore, a.resultJson),
            ),
          }
        : undefined,
      'full',
      'unlock',
    );

    const overallScore = (result.overall_score as number) || analysis.overallScore || 0;

    const charged = await prisma.$transaction(async (tx) => {
      const reserved = await tx.user.updateMany({
        where: { id: user.id, referralCredits: { gt: 0 } },
        data: { referralCredits: { decrement: 1 } },
      });
      if (reserved.count === 0) {
        return null;
      }
      const updated = await tx.analysis.update({
        where: { id: analysis.id },
        data: {
          resultJson: result as Prisma.InputJsonValue,
          overallScore,
          accessTier: 'full',
          demo,
        },
      });
      const refreshedUser = await tx.user.findUnique({ where: { id: user.id } });
      return { updated, referralCredits: refreshedUser?.referralCredits ?? 0 };
    });

    if (!charged) {
      res.status(403).json({ error: 'Нет бесплатных полных анализов' });
      return;
    }

    const contentLevel = resolveContentLevel('full', false);
    const clientResult = sanitizeFaceResultForClient(
      enrichAnalysisInsights(result as Record<string, unknown>),
      contentLevel,
    );

    res.json({
      analysis: {
        id: charged.updated.id,
        ...clientResult,
        photoUrl: charged.updated.photoUrl,
        accessTier: 'full',
        contentLevel,
        demo: charged.updated.demo,
        createdAt: charged.updated.createdAt,
      },
      referralCredits: charged.referralCredits,
    });
  } catch (err) {
    console.error('Unlock analysis error:', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'PHOTO_MISSING') {
      res.status(404).json({ error: 'Фото анализа не найдено. Сделайте новый анализ.' });
      return;
    }
    // Surface AI / config errors so the client can show them (not a silent button reset)
    if (
      message.includes('ИИ')
      || message.includes('Модель')
      || message.includes('Лимит')
      || message.includes('API')
      || message.includes('фото')
      || message.toLowerCase().includes('timeout')
    ) {
      res.status(503).json({
        error: message.includes('ИИ') || message.includes('Модель') || message.includes('Лимит')
          ? message
          : 'ИИ слишком долго отвечает. Кредит не списан. Попробуйте ещё раз.',
      });
      return;
    }
    res.status(500).json({
      error: message.slice(0, 200) || 'Не удалось открыть полный разбор. Кредит не списан.',
    });
  } finally {
    if (tempPhotoPath && fs.existsSync(tempPhotoPath)) {
      try {
        fs.unlinkSync(tempPhotoPath);
      } catch {
        /* ignore */
      }
    }
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
      res.send(bytesToBuffer(analysis.photoData));
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
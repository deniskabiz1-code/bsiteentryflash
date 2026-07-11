import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import { findOrCreateUser, isSubscriptionActive } from '../services/telegram';
import {
  analyzeFace,
  analyzeHairstyle,
  generateHairstylePreview,
} from '../services/openai';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
    if (count === 0) return { allowed: true, useCredit: false };
  }

  if (referralCredits > 0) {
    return { allowed: true, useCredit: true };
  }

  return {
    allowed: false,
    useCredit: false,
    reason: 'Требуется подписка или реферальные кредиты',
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
        user.subscriptionEnd,
        user.referralCredits,
        'face'
      );

      if (!access.allowed) {
        fs.unlinkSync(req.file.path);
        res.status(403).json({ error: access.reason });
        return;
      }

      const { data: result, demo } = await analyzeFace(req.file.path);
      const overallScore = (result.overall_score as number) || 0;

      const analysis = await prisma.analysis.create({
        data: {
          userId: user.id,
          type: 'face',
          photoUrl: `/uploads/${req.file.filename}`,
          resultJson: result as Prisma.InputJsonValue,
          overallScore,
        },
      });

      if (access.useCredit) {
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCredits: { decrement: 1 } },
        });
      }

      res.json({
        analysis: {
          id: analysis.id,
          ...result,
          photoUrl: analysis.photoUrl,
          demo,
        },
      });
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

      const analysis = await prisma.analysis.create({
        data: {
          userId: user.id,
          type: 'hairstyle',
          photoUrl: `/uploads/${front.filename}`,
          sidePhotoUrl: `/uploads/${side.filename}`,
          resultJson: result as Prisma.InputJsonValue,
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

    res.json({ analyses });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Ошибка загрузки истории' });
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

    res.json({ analysis });
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
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import { isAdminAuthorized } from '../middleware/adminAuth';
import {
  findOrCreateUser,
  getPublicApiBaseUrl,
  notifyAdminReferralProof,
  sendBotMessage,
} from '../services/telegram';
import { prisma } from '../utils/prisma';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `proof-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname) || '.jpg'}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/info', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const botUsername = process.env.BOT_USERNAME || 'primeform_bot';
    const referralLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;

    res.json({
      referralCode: user.referralCode,
      referralCredits: user.referralCredits,
      referralLink,
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

router.post('/apply', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) {
      res.status(400).json({ error: 'Укажите реферальный код' });
      return;
    }

    const user = await findOrCreateUser(req.telegramUser!);
    if (user.referredBy) {
      res.status(400).json({ error: 'Реферальный код уже использован' });
      return;
    }

    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (!referrer || referrer.id === user.id) {
      res.status(400).json({ error: 'Недействительный реферальный код' });
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { referredBy: referrer.id },
      }),
      prisma.user.update({
        where: { id: referrer.id },
        data: { referralCredits: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { referralCredits: { increment: 1 } },
      }),
    ]);

    res.json({ success: true, credits: 1 });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка применения кода' });
  }
});

router.post(
  '/proof',
  validateTelegramAuth,
  upload.single('screenshot'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Загрузите скриншот' });
        return;
      }

      const user = await findOrCreateUser(req.telegramUser!);

      const proof = await prisma.referralProof.create({
        data: {
          userId: user.id,
          imageUrl: `/uploads/${req.file.filename}`,
        },
      });

      notifyAdminReferralProof({
        id: proof.id,
        imageUrl: proof.imageUrl,
        username: user.username,
        telegramId: user.telegramId,
      }).catch((err) => {
        console.error('[referral] Admin notify failed:', err);
      });

      res.json({
        success: true,
        proofId: proof.id,
        message: 'Скриншот отправлен на проверку',
      });
    } catch (err) {
      res.status(500).json({ error: 'Ошибка загрузки' });
    }
  }
);

router.get('/admin/pending', async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const baseUrl = getPublicApiBaseUrl();
    const proofs = await prisma.referralProof.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            telegramId: true,
            name: true,
          },
        },
      },
    });

    res.json({
      proofs: proofs.map((proof) => ({
        id: proof.id,
        imageUrl: proof.imageUrl,
        imageFullUrl: `${baseUrl}${proof.imageUrl}`,
        createdAt: proof.createdAt,
        user: {
          id: proof.user.id,
          name: proof.user.name,
          username: proof.user.username,
          telegramId: proof.user.telegramId.toString(),
        },
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

router.post('/admin/approve', async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const { proofId, action } = req.body;
    const proof = await prisma.referralProof.findUnique({
      where: { id: proofId },
      include: { user: { select: { telegramId: true } } },
    });

    if (!proof || proof.status !== 'pending') {
      res.status(404).json({ error: 'Заявка не найдена' });
      return;
    }

    if (action === 'approve') {
      await prisma.$transaction([
        prisma.referralProof.update({
          where: { id: proofId },
          data: { status: 'approved' },
        }),
        prisma.user.update({
          where: { id: proof.userId },
          data: { referralCredits: { increment: 1 } },
        }),
      ]);
      sendBotMessage(
        Number(proof.user.telegramId),
        '✅ <b>Заявка одобрена!</b>\n\nВам начислен +1 анализ. Откройте Primeform и сделайте чек-ин.',
      ).catch(() => {});
      res.json({ success: true, message: 'Кредит начислен' });
    } else {
      await prisma.referralProof.update({
        where: { id: proofId },
        data: { status: 'rejected' },
      });
      sendBotMessage(
        Number(proof.user.telegramId),
        '❌ <b>Заявка отклонена</b>\n\nСкриншот не прошёл проверку. Убедитесь, что видны 5 комментариев под looksmax-видео, и отправьте снова.',
      ).catch(() => {});
      res.json({ success: true, message: 'Заявка отклонена' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

export default router;
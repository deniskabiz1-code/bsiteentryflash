import { Router, Response } from 'express';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import {
  findOrCreateUser,
  checkChannelSubscription,
  isSubscriptionActive,
  getChannelOpenUrl,
} from '../services/telegram';
import { prisma } from '../utils/prisma';

const router = Router();

router.post('/me', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const channelCheck = await checkChannelSubscription(req.telegramUser!.id);
    const subscribed = channelCheck.subscribed;

    const faceAnalysisCount = await prisma.analysis.count({
      where: { userId: user.id, type: 'face' },
    });

    res.json({
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
        name: user.name,
        age: user.age,
        goals: user.goals,
        referralCode: user.referralCode,
        referralCredits: user.referralCredits,
        subscriptionActive: isSubscriptionActive(user.subscriptionEnd),
        subscriptionEnd: user.subscriptionEnd,
        reminderEnabled: user.reminderEnabled,
        reminderTime: user.reminderTime,
        onboarded: user.onboarded,
        faceAnalysisCount,
      },
      channelSubscribed: subscribed,
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
});

router.get('/channel-check', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  const result = await checkChannelSubscription(req.telegramUser!.id);
  res.json(result);
});

router.get('/channel-info', (_req, res: Response) => {
  const username = (process.env.CHANNEL_USERNAME || 'primeform_channel').replace(/^@/, '');
  res.json({
    link: getChannelOpenUrl(),
    username,
  });
});

export default router;
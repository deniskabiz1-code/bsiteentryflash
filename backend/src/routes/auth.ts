import { Router, Response } from 'express';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import {
  findOrCreateUser,
  checkChannelSubscription,
  getChannelOpenUrl,
  getUserProfilePhotoFilePath,
} from '../services/telegram';
import { serializeUser } from '../services/userProfile';
import { isTestCreditsEnabled } from './user';

const router = Router();

router.post('/me', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);

    res.json({
      user: await serializeUser(user),
      channelSubscribed: true,
      testCreditsEnabled: isTestCreditsEnabled(),
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
});

router.get('/profile-photo', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      res.status(404).end();
      return;
    }

    const filePath = await getUserProfilePhotoFilePath(req.telegramUser!.id);
    if (!filePath) {
      res.status(404).end();
      return;
    }

    const fileRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
    if (!fileRes.ok) {
      res.status(404).end();
      return;
    }

    const contentType = fileRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Profile photo error:', err);
    res.status(500).end();
  }
});

router.get('/channel-check', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  const result = await checkChannelSubscription(req.telegramUser!.id);
  res.json(result);
});

router.get('/channel-info', (_req, res: Response) => {
  const username = (process.env.CHANNEL_USERNAME || 'primeformnews').replace(/^@/, '');
  res.json({
    link: getChannelOpenUrl(),
    username,
  });
});

export default router;
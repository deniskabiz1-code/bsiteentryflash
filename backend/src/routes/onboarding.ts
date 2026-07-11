import { Router, Response } from 'express';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import { findOrCreateUser, checkChannelSubscription } from '../services/telegram';
import { prisma } from '../utils/prisma';

const router = Router();

const VALID_GOALS = ['skin', 'face', 'style'];

router.post('/complete', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, age, goals } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      res.status(400).json({ error: 'Укажите имя' });
      return;
    }

    const ageNum = typeof age === 'number' ? age : parseInt(String(age), 10);
    if (isNaN(ageNum) || ageNum < 14 || ageNum > 60) {
      res.status(400).json({ error: 'Возраст должен быть от 14 до 60' });
      return;
    }

    if (!Array.isArray(goals) || goals.length === 0) {
      res.status(400).json({ error: 'Выберите хотя бы одну цель' });
      return;
    }

    const validGoals = goals.filter((g: string) => VALID_GOALS.includes(g));
    if (validGoals.length === 0) {
      res.status(400).json({ error: 'Некорректные цели' });
      return;
    }

    const channelCheck = await checkChannelSubscription(req.telegramUser!.id);
    if (!channelCheck.subscribed) {
      res.status(403).json({
        error: channelCheck.error || 'Подпишитесь на канал, чтобы продолжить',
        hint: channelCheck.hint,
      });
      return;
    }

    const user = await findOrCreateUser(req.telegramUser!);

    const updated = await prisma.user.update({
      where: { telegramId: BigInt(req.telegramUser!.id) },
      data: {
        name: name.trim(),
        age: ageNum,
        goals: validGoals,
        onboarded: true,
      },
    });

    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        age: updated.age,
        goals: updated.goals,
        onboarded: updated.onboarded,
      },
    });
  } catch (err) {
    console.error('Onboarding error:', err);
    const prismaCode = (err as { code?: string }).code;
    if (prismaCode === 'P2025') {
      res.status(500).json({
        error: 'Профиль не найден',
        hint: 'Перезапустите приложение и попробуйте снова',
      });
      return;
    }
    if (prismaCode === 'P2021') {
      res.status(500).json({
        error: 'База данных не настроена',
        hint: 'На сервере не выполнен prisma db push',
      });
      return;
    }
    res.status(500).json({ error: 'Ошибка сохранения профиля' });
  }
});

export default router;
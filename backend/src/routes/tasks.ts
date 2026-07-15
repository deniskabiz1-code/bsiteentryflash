import { Router, Response } from 'express';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import { findOrCreateUser } from '../services/telegram';
import { prisma } from '../utils/prisma';
import {
  buildDailyFocusResponse,
  calculateFocusStreak,
  isValidFocusTaskKey,
} from '../services/dailyFocus';

const router = Router();

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get('/daily', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const payload = await buildDailyFocusResponse(user, todayDate());
    res.json(payload);
  } catch (err) {
    console.error('Tasks error:', err);
    res.status(500).json({ error: 'Ошибка загрузки задач' });
  }
});

router.post('/toggle', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { taskKey } = req.body;
    if (!taskKey || !isValidFocusTaskKey(taskKey)) {
      res.status(400).json({ error: 'Неизвестная задача' });
      return;
    }

    const user = await findOrCreateUser(req.telegramUser!);
    const today = todayDate();

    const existing = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskKey_date: { userId: user.id, taskKey, date: today },
      },
    });

    if (existing) {
      await prisma.taskCompletion.delete({ where: { id: existing.id } });
      res.json({ completed: false });
    } else {
      await prisma.taskCompletion.create({
        data: { userId: user.id, taskKey, date: today },
      });
      res.json({ completed: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления задачи' });
  }
});

router.get('/streak', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const streak = await calculateFocusStreak(user.id);
    res.json({ streak });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

export default router;
import { Router, Response } from 'express';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import { findOrCreateUser } from '../services/telegram';
import { prisma } from '../utils/prisma';
import { DAILY_TASKS, CATEGORY_LABELS, NEVER_DO_LIST } from '../data/tasks';
import { getDailyTip } from '../data/dailyTips';

const router = Router();

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function calculateStreak(userId: number): Promise<number> {
  const allTasksCount = DAILY_TASKS.length;
  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const completed = await prisma.taskCompletion.count({
      where: { userId, date: checkDate },
    });

    if (completed >= allTasksCount) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  return streak;
}

router.get('/daily', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const today = todayDate();

    const completions = await prisma.taskCompletion.findMany({
      where: { userId: user.id, date: today },
    });

    const completedKeys = new Set(completions.map((c) => c.taskKey));
    const streak = await calculateStreak(user.id);

    const grouped = Object.entries(CATEGORY_LABELS).map(([category, label]) => ({
      category,
      label,
      tasks: DAILY_TASKS.filter((t) => t.category === category).map((t) => ({
        key: t.key,
        label: t.label,
        completed: completedKeys.has(t.key),
      })),
    }));

    res.json({
      streak,
      dailyTip: getDailyTip(),
      tasks: grouped,
      neverDo: NEVER_DO_LIST,
      allCompletedToday: completedKeys.size >= DAILY_TASKS.length,
    });
  } catch (err) {
    console.error('Tasks error:', err);
    res.status(500).json({ error: 'Ошибка загрузки задач' });
  }
});

router.post('/toggle', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { taskKey } = req.body;
    const validKey = DAILY_TASKS.find((t) => t.key === taskKey);
    if (!validKey) {
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
    const streak = await calculateStreak(user.id);
    res.json({ streak });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

export default router;
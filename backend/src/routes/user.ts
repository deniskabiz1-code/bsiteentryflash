import { Router, Response } from 'express';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import { findOrCreateUser, isSubscriptionActive } from '../services/telegram';
import { serializeUser } from '../services/userProfile';
import { resolveReminderTimezone } from '../services/reminders';
import { prisma } from '../utils/prisma';

export function isTestCreditsEnabled(): boolean {
  return process.env.ENABLE_TEST_CREDITS !== 'false';
}

const router = Router();

router.put('/profile', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, age, goals } = req.body;
    const user = await findOrCreateUser(req.telegramUser!);

    const data: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) {
      data.name = name.trim();
    }
    if (age !== undefined && age !== null && age !== '') {
      const ageNum = parseInt(String(age), 10);
      if (ageNum >= 14 && ageNum <= 60) {
        data.age = ageNum;
      }
    }
    if (Array.isArray(goals)) {
      data.goals = goals;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'Нет данных для сохранения' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    res.json({ user: await serializeUser(updated) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

router.put('/reminders', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, time, timezone } = req.body;
    const user = await findOrCreateUser(req.telegramUser!);
    const reminderTimezone =
      typeof timezone === 'string' && timezone.trim()
        ? resolveReminderTimezone(timezone)
        : user.reminderTimezone || resolveReminderTimezone(null);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        reminderEnabled: !!enabled,
        reminderTime: time || null,
        reminderTimezone: !!enabled ? reminderTimezone : user.reminderTimezone,
        reminderLastSentDate: null,
      },
    });

    res.json({
      reminderEnabled: updated.reminderEnabled,
      reminderTime: updated.reminderTime,
      reminderTimezone: updated.reminderTimezone,
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

router.get('/skincare', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);

    if (!isSubscriptionActive(user.subscriptionEnd)) {
      res.status(403).json({ error: 'Доступно по подписке' });
      return;
    }

    const lastFace = await prisma.analysis.findFirst({
      where: { userId: user.id, type: 'face' },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastFace) {
      res.json({ routine: null });
      return;
    }

    const result = lastFace.resultJson as Record<string, unknown>;
    res.json({ routine: result.skincare_routine || [] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

router.get('/last-checkin', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const last = await prisma.analysis.findFirst({
      where: { userId: user.id, type: 'face' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ checkin: last });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

async function deleteUserAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const confirm = req.body?.confirm;
    if (confirm !== 'DELETE') {
      res.status(400).json({ error: 'Подтвердите удаление' });
      return;
    }

    const user = await findOrCreateUser(req.telegramUser!);
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
}

router.post('/account/delete', validateTelegramAuth, deleteUserAccount);
router.delete('/account', validateTelegramAuth, deleteUserAccount);

router.post('/test-credit', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!isTestCreditsEnabled()) {
      res.status(403).json({ error: 'Тестовые кредиты отключены' });
      return;
    }

    const user = await findOrCreateUser(req.telegramUser!);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { referralCredits: { increment: 1 } },
    });

    res.json({
      user: await serializeUser(updated),
      referralCredits: updated.referralCredits,
    });
  } catch (err) {
    console.error('Test credit error:', err);
    res.status(500).json({ error: 'Не удалось начислить кредит' });
  }
});

export default router;
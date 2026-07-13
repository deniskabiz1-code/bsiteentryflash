import { prisma } from '../utils/prisma';
import { sendBotMessage } from './telegram';

const DEFAULT_TIMEZONE = 'Europe/Moscow';
const TICK_MS = 60_000;

let schedulerStarted = false;

export function resolveReminderTimezone(userTz?: string | null): string {
  const candidate = userTz?.trim();
  if (!candidate) {
    return process.env.REMINDER_TIMEZONE?.trim() || DEFAULT_TIMEZONE;
  }
  try {
    Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    return process.env.REMINDER_TIMEZONE?.trim() || DEFAULT_TIMEZONE;
  }
}

function getLocalHm(now = new Date(), timeZone = DEFAULT_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

function getLocalDateKey(now = new Date(), timeZone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function buildReminderMessage(): string {
  return [
    '⏰ <b>Напоминание Primeform</b>',
    '',
    'Время для чек-ина — откройте приложение и обновите анализ лица.',
  ].join('\n');
}

export type ReminderRunResult = {
  checked: number;
  sent: number;
  skipped: number;
};

export async function processDueReminders(): Promise<ReminderRunResult> {
  const users = await prisma.user.findMany({
    where: {
      reminderEnabled: true,
      reminderTime: { not: null },
      onboarded: true,
    },
    select: {
      id: true,
      telegramId: true,
      reminderTime: true,
      reminderTimezone: true,
      reminderLastSentDate: true,
      _count: {
        select: {
          analyses: { where: { type: 'face' } },
        },
      },
    },
  });

  const now = new Date();
  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const timezone = resolveReminderTimezone(user.reminderTimezone);
    const nowHm = getLocalHm(now, timezone);
    const todayKey = getLocalDateKey(now, timezone);
    const faceAnalysisCount = user._count.analyses;

    if (user.reminderTime !== nowHm) {
      skipped += 1;
      continue;
    }
    if (user.reminderLastSentDate === todayKey) {
      skipped += 1;
      continue;
    }
    if (faceAnalysisCount === 0) {
      skipped += 1;
      continue;
    }

    await sendBotMessage(
      Number(user.telegramId),
      buildReminderMessage(),
      { buttonText: 'Открыть Primeform' },
    );
    await prisma.user.update({
      where: { id: user.id },
      data: { reminderLastSentDate: todayKey },
    });
    sent += 1;
    console.log(`[reminders] Sent to user ${user.id} at ${nowHm} (${timezone}), analyses=${faceAnalysisCount}`);
  }

  if (sent > 0) {
    console.log(`[reminders] Batch complete: ${sent} sent, ${skipped} skipped`);
  }

  return { checked: users.length, sent, skipped };
}

export function startReminderScheduler(): void {
  if (schedulerStarted || process.env.DISABLE_REMINDER_SCHEDULER === 'true') {
    return;
  }
  schedulerStarted = true;

  const tick = () => {
    processDueReminders().catch((err) => {
      console.error('[reminders] Scheduler tick failed:', err);
    });
  };

  tick();
  setInterval(tick, TICK_MS);
  console.log(`[reminders] Scheduler started (every ${TICK_MS / 1000}s, per-user timezone)`);
}
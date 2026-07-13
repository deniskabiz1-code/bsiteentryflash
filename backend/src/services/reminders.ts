import { prisma } from '../utils/prisma';
import { sendBotMessage } from './telegram';

const DEFAULT_TIMEZONE = 'Europe/Moscow';
const TICK_MS = 60_000;

let schedulerStarted = false;

function getTimezone(): string {
  return process.env.REMINDER_TIMEZONE?.trim() || DEFAULT_TIMEZONE;
}

function getLocalHm(now = new Date(), timeZone = getTimezone()): string {
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

function getLocalDateKey(now = new Date(), timeZone = getTimezone()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function buildReminderMessage(): string {
  const appUrl = (process.env.APP_URL || process.env.FRONTEND_URL || '').trim();
  const lines = [
    '⏰ <b>Напоминание Primeform</b>',
    '',
    'Время для еженедельного чек-ина — откройте приложение и сделайте анализ лица.',
  ];
  if (appUrl) {
    lines.push('', `<a href="${appUrl}">Открыть Primeform</a>`);
  }
  return lines.join('\n');
}

export type ReminderRunResult = {
  checked: number;
  sent: number;
  skipped: number;
  time: string;
  timezone: string;
};

export async function processDueReminders(): Promise<ReminderRunResult> {
  const timezone = getTimezone();
  const nowHm = getLocalHm(new Date(), timezone);
  const todayKey = getLocalDateKey(new Date(), timezone);

  const users = await prisma.user.findMany({
    where: {
      reminderEnabled: true,
      reminderTime: { not: null },
    },
    select: {
      id: true,
      telegramId: true,
      reminderTime: true,
      reminderLastSentDate: true,
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.reminderTime !== nowHm) {
      skipped += 1;
      continue;
    }
    if (user.reminderLastSentDate === todayKey) {
      skipped += 1;
      continue;
    }

    await sendBotMessage(Number(user.telegramId), buildReminderMessage());
    await prisma.user.update({
      where: { id: user.id },
      data: { reminderLastSentDate: todayKey },
    });
    sent += 1;
  }

  if (sent > 0) {
    console.log(`[reminders] Sent ${sent} reminder(s) at ${nowHm} (${timezone})`);
  }

  return {
    checked: users.length,
    sent,
    skipped,
    time: nowHm,
    timezone,
  };
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
  console.log(`[reminders] Scheduler started (every ${TICK_MS / 1000}s, tz=${getTimezone()})`);
}
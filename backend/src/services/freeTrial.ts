import { prisma } from '../utils/prisma';
import { isSubscriptionActive } from './telegram';

export async function hasTelegramUsedFreeTrial(telegramId: bigint): Promise<boolean> {
  const record = await prisma.telegramFreeTrial.findUnique({
    where: { telegramId },
    select: { telegramId: true },
  });
  return Boolean(record);
}

export async function markTelegramFreeTrialUsed(telegramId: bigint): Promise<void> {
  await prisma.telegramFreeTrial.upsert({
    where: { telegramId },
    create: { telegramId },
    update: {},
  });
}

/** True when user should see the first-analysis onboarding flow (no face analyses yet). */
export async function isFreeAnalysisAvailable(
  _telegramId: bigint,
  userId: number,
  subscriptionEnd: Date | null,
): Promise<boolean> {
  if (isSubscriptionActive(subscriptionEnd)) {
    return false;
  }

  const faceCount = await prisma.analysis.count({
    where: { userId, type: 'face' },
  });
  return faceCount === 0;
}

/** Backfill trial usage from existing face analyses (survives account deletion). */
export async function backfillTelegramFreeTrials(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { analyses: { some: { type: 'face' } } },
    select: { telegramId: true },
    distinct: ['telegramId'],
  });

  await Promise.all(
    users.map((row) => markTelegramFreeTrialUsed(row.telegramId)),
  );
}
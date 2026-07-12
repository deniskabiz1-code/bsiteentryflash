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

export async function isFreeAnalysisAvailable(
  telegramId: bigint,
  userId: number,
  subscriptionEnd: Date | null,
): Promise<boolean> {
  if (isSubscriptionActive(subscriptionEnd)) {
    return false;
  }

  const faceCount = await prisma.analysis.count({
    where: { userId, type: 'face' },
  });
  if (faceCount > 0) {
    return false;
  }

  return !(await hasTelegramUsedFreeTrial(telegramId));
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
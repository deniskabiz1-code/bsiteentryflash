import { prisma } from '../utils/prisma';
import { sendBotMessage } from './telegram';

export async function rewardReferrerOnSubscriptionPurchase(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      referredBy: true,
      referralSubRewardGranted: true,
    },
  });

  if (!user?.referredBy || user.referralSubRewardGranted) {
    return;
  }

  const referrer = await prisma.user.findUnique({
    where: { id: user.referredBy },
    select: { id: true, telegramId: true },
  });

  if (!referrer || referrer.id === user.id) {
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { referralSubRewardGranted: true },
    }),
    prisma.user.update({
      where: { id: referrer.id },
      data: { referralCredits: { increment: 1 } },
    }),
  ]);

  sendBotMessage(
    Number(referrer.telegramId),
    '🎉 <b>Реферальный бонус!</b>\n\nВаш друг оформил подписку. Вам начислен +1 полный анализ.',
    { buttonText: 'Сделать анализ' },
  ).catch((err) => {
    console.error('[referral] Referrer notify failed:', err);
  });
}
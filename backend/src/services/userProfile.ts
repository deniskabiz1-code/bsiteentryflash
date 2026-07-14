import { User } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { isSubscriptionActive } from './telegram';
import { isFreeAnalysisAvailable } from './freeTrial';

export async function serializeUser(user: User) {
  const faceAnalysisCount = await prisma.analysis.count({
    where: { userId: user.id, type: 'face' },
  });

  const freeAnalysisAvailable = await isFreeAnalysisAvailable(
    user.telegramId,
    user.id,
    user.subscriptionEnd,
  );

  return {
    id: user.id,
    telegramId: user.telegramId.toString(),
    username: user.username,
    name: user.name,
    age: user.age,
    goals: user.goals,
    referralCode: user.referralCode,
    referralCredits: user.referralCredits,
    subscriptionActive: isSubscriptionActive(user.subscriptionEnd),
    subscriptionEnd: user.subscriptionEnd,
    reminderEnabled: user.reminderEnabled,
    reminderTime: user.reminderTime,
    reminderTimezone: user.reminderTimezone,
    personalizedAnalysis: user.personalizedAnalysis ?? true,
    onboarded: user.onboarded,
    faceAnalysisCount,
    freeAnalysisAvailable,
  };
}
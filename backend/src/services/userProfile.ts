import { User } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { isSubscriptionActive } from './telegram';
import { isFreeAnalysisAvailable } from './freeTrial';

export function isProfileComplete(user: Pick<User, 'name' | 'age' | 'goals'>): boolean {
  return Boolean(
    user.name?.trim()
    && user.age != null
    && user.age >= 14
    && user.goals.length > 0,
  );
}

export async function repairOnboardedIfNeeded(user: User): Promise<User> {
  if (user.onboarded) return user;

  const faceAnalysisCount = await prisma.analysis.count({
    where: { userId: user.id, type: 'face' },
  });

  if (faceAnalysisCount > 0 || isProfileComplete(user)) {
    return prisma.user.update({
      where: { id: user.id },
      data: { onboarded: true },
    });
  }

  return user;
}

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
    personalizedAnalysis: user.personalizedAnalysis === false ? false : true,
    darkTheme: user.darkTheme === true,
    onboarded: user.onboarded,
    faceAnalysisCount,
    freeAnalysisAvailable,
  };
}
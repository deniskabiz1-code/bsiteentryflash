import type { User } from '@/types';

export function shouldSkipOnboarding(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.onboarded) return true;
  if ((user.faceAnalysisCount ?? 0) > 0) return true;
  return Boolean(
    user.name?.trim()
    && user.age != null
    && user.age >= 14
    && (user.goals?.length ?? 0) > 0,
  );
}
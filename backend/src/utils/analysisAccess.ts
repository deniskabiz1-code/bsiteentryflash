export type AnalysisAccessTier = 'free' | 'full';
export type AnalysisContentLevel = 'preview' | 'full' | 'premium';

const PREVIEW_FIELDS = new Set([
  'overall_score',
  'scores',
  'skin_type',
  'puffiness',
  'summary',
  'photoUrl',
  'id',
  'createdAt',
  'demo',
  'accessTier',
  'contentLevel',
  'type',
  'overallScore',
  'resultJson',
]);

/** Access for a newly run analysis. Credits never auto-apply here — only via explicit unlock. */
export function resolveAccessTier(subscribed: boolean): AnalysisAccessTier {
  return subscribed ? 'full' : 'free';
}

export function resolveContentLevel(
  accessTier: string | null | undefined,
  subscribed: boolean,
): AnalysisContentLevel {
  if (subscribed && accessTier === 'full') return 'premium';
  if (accessTier === 'full') return 'full';
  return 'preview';
}

export function sanitizeFaceResultForClient<T extends Record<string, unknown>>(
  result: T,
  contentLevel: AnalysisContentLevel,
): T {
  // full = referral credit unlock; premium = active subscription
  if (contentLevel === 'premium' || contentLevel === 'full') return result;

  const preview: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(result)) {
    if (PREVIEW_FIELDS.has(key) && value !== undefined) {
      preview[key] = value;
    }
  }
  return preview as T;
}
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

export function resolveAccessTier(
  subscribed: boolean,
  useCredit: boolean,
): AnalysisAccessTier {
  if (subscribed || useCredit) return 'full';
  return 'free';
}

export function resolveContentLevel(
  accessTier: string | null | undefined,
  subscribed: boolean,
): AnalysisContentLevel {
  if (accessTier === 'full') {
    return subscribed ? 'premium' : 'full';
  }
  return 'preview';
}

export function sanitizeFaceResultForClient<T extends Record<string, unknown>>(
  result: T,
  contentLevel: AnalysisContentLevel,
): T {
  if (contentLevel === 'premium') return result;

  if (contentLevel === 'preview') {
    const preview: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(result)) {
      if (PREVIEW_FIELDS.has(key) && value !== undefined) {
        preview[key] = value;
      }
    }
    return preview as T;
  }

  if ('skincare_routine' in result) {
    const { skincare_routine: _removed, ...rest } = result;
    return rest as T;
  }

  return result;
}
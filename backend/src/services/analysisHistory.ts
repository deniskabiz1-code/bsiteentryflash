export type FaceAnalysisHistoryEntry = {
  date: string;
  overall_score: number;
  scores: {
    skin?: number;
    jawline?: number;
    symmetry?: number;
    hairstyle?: number;
  };
  skin_type?: string;
  puffiness?: string;
  problem_zones?: { zone: string; description: string }[];
  improvement_tips?: string[];
};

/** Preview fields the user already saw — unlock must not change these. */
export type LockedFacePreview = {
  overall_score?: number;
  scores?: FaceAnalysisHistoryEntry['scores'];
  summary?: string;
  skin_type?: string;
  puffiness?: string;
};

export type FaceAnalysisUserContext = {
  name?: string | null;
  age?: number | null;
  goals?: string[];
  previousAnalyses: FaceAnalysisHistoryEntry[];
  /** When unlocking a free analysis: keep scores/summary stable for the user. */
  lockedPreview?: LockedFacePreview;
};

export function toLockedFacePreview(
  resultJson: unknown,
  overallScore?: number | null,
): LockedFacePreview | undefined {
  const result = (resultJson ?? {}) as Record<string, unknown>;
  const scores = pickScores(result);
  const hasScores = Object.values(scores).some((v) => typeof v === 'number');
  const overall =
    typeof result.overall_score === 'number'
      ? result.overall_score
      : typeof overallScore === 'number'
        ? overallScore
        : undefined;

  if (overall == null && !hasScores && typeof result.summary !== 'string') {
    return undefined;
  }

  return {
    overall_score: overall,
    scores: hasScores ? scores : undefined,
    summary: typeof result.summary === 'string' ? result.summary : undefined,
    skin_type: typeof result.skin_type === 'string' ? result.skin_type : undefined,
    puffiness: typeof result.puffiness === 'string' ? result.puffiness : undefined,
  };
}

const GOAL_LABELS: Record<string, string> = {
  skin: 'кожа',
  face: 'лицо',
  style: 'стиль',
};

function pickScores(result: Record<string, unknown>): FaceAnalysisHistoryEntry['scores'] {
  const raw = result.scores;
  if (!raw || typeof raw !== 'object') return {};
  const scores = raw as Record<string, unknown>;
  return {
    skin: typeof scores.skin === 'number' ? scores.skin : undefined,
    jawline: typeof scores.jawline === 'number' ? scores.jawline : undefined,
    symmetry: typeof scores.symmetry === 'number' ? scores.symmetry : undefined,
    hairstyle: typeof scores.hairstyle === 'number' ? scores.hairstyle : undefined,
  };
}

export function toFaceHistoryEntry(
  createdAt: Date,
  overallScore: number | null,
  resultJson: unknown,
): FaceAnalysisHistoryEntry {
  const result = (resultJson ?? {}) as Record<string, unknown>;
  const problemZones = Array.isArray(result.problem_zones)
    ? result.problem_zones.slice(0, 3) as { zone: string; description: string }[]
    : undefined;
  const tips = Array.isArray(result.improvement_tips)
    ? (result.improvement_tips as string[]).slice(0, 4)
    : undefined;

  return {
    date: createdAt.toISOString().slice(0, 10),
    overall_score: overallScore ?? (result.overall_score as number) ?? 0,
    scores: pickScores(result),
    skin_type: typeof result.skin_type === 'string' ? result.skin_type : undefined,
    puffiness: typeof result.puffiness === 'string' ? result.puffiness : undefined,
    problem_zones: problemZones,
    improvement_tips: tips,
  };
}

function buildUnlockLockBlock(locked: LockedFacePreview): string {
  return `UNLOCK / EXPAND MODE (mandatory):
This is the SAME photo the user already analyzed for free. They are unlocking the FULL write-up.
You MUST copy these fields EXACTLY into your JSON (same numbers, same summary, same skin_type/puffiness). Do NOT re-rate the face. Do NOT change overall_score or any sub-score by even 1 point. Do NOT rewrite the summary.
Locked fields (copy verbatim):
${JSON.stringify(locked, null, 2)}

Your job is only to ADD the full sections consistent with those locked scores: strengths, quick_wins, photo_feedback, hair_notes, face_shape, best_haircuts, haircuts_to_avoid, problem_zones, improvement_tips, growth_plan, skincare_routine, progress_vs_last.
Opinions and advice must match the locked scores (e.g. if overall is 72, do not write as if it is a weak 50).`;
}

export function buildFaceAnalysisUserMessage(context?: FaceAnalysisUserContext): string {
  const profileBits: string[] = [];
  if (context?.name) profileBits.push(`Имя: ${context.name}`);
  if (context?.age) profileBits.push(`Возраст: ${context.age}`);
  if (context?.goals?.length) {
    const goals = context.goals.map((g) => GOAL_LABELS[g] ?? g).join(', ');
    profileBits.push(`Цели: ${goals}`);
  }
  const profileLine = profileBits.length ? `${profileBits.join('. ')}.\n` : '';

  if (context?.lockedPreview) {
    const historyNote = context.previousAnalyses?.length
      ? `\n(Optional continuity) Past analyses for progress_vs_last only — do NOT override locked scores:\n${JSON.stringify(context.previousAnalyses, null, 2)}`
      : '';
    return `${profileLine}${buildUnlockLockBlock(context.lockedPreview)}
В scores: jawline = линия челюсти (в русском тексте только «линия челюсти»).
Верни полный JSON.${historyNote}`;
  }

  if (!context?.previousAnalyses.length) {
    return `${profileLine}Проанализируй это фото и верни JSON. Это первый анализ пользователя.`;
  }

  // Present score keys for the model with Russian labels in a note; keep JSON keys as-is for structure
  const historyJson = JSON.stringify(context.previousAnalyses, null, 2);

  return `${profileLine}Это повторный чек-ин. Ниже прошлые анализы (от нового к старому). Сравни новое фото с динамикой и верни JSON.
В scores: jawline = линия челюсти (в русском тексте пиши только «линия челюсти», никогда английское jawline).

Прошлые анализы:
${historyJson}`;
}
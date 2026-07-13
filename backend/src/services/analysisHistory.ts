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

export type FaceAnalysisUserContext = {
  name?: string | null;
  age?: number | null;
  goals?: string[];
  previousAnalyses: FaceAnalysisHistoryEntry[];
};

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

export function buildFaceAnalysisUserMessage(context?: FaceAnalysisUserContext): string {
  if (!context?.previousAnalyses.length) {
    return 'Проанализируй это фото и верни JSON. Это первый анализ пользователя.';
  }

  const profileBits: string[] = [];
  if (context.name) profileBits.push(`Имя: ${context.name}`);
  if (context.age) profileBits.push(`Возраст: ${context.age}`);
  if (context.goals?.length) {
    const goals = context.goals.map((g) => GOAL_LABELS[g] ?? g).join(', ');
    profileBits.push(`Цели: ${goals}`);
  }

  const historyJson = JSON.stringify(context.previousAnalyses, null, 2);
  const profileLine = profileBits.length ? `${profileBits.join('. ')}.\n` : '';

  return `${profileLine}Это повторный чек-ин. Ниже прошлые анализы (от нового к старому). Сравни новое фото с динамикой и верни JSON.

Прошлые анализы:
${historyJson}`;
}
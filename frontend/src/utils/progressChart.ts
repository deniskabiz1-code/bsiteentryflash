export type ChartPeriod = 'День' | 'Неделя' | 'Месяц' | 'Год';

export type ChartPoint = {
  score: number;
  date: string;
};

const PERIOD_MS: Record<ChartPeriod, number> = {
  День: 24 * 60 * 60 * 1000,
  Неделя: 7 * 24 * 60 * 60 * 1000,
  Месяц: 30 * 24 * 60 * 60 * 1000,
  Год: 365 * 24 * 60 * 60 * 1000,
};

type ScoredAnalysis = {
  overallScore: number | null;
  createdAt: string;
};

export function scoresForPeriod(
  analyses: ScoredAnalysis[],
  period: ChartPeriod,
  maxBars = 10,
): { points: ChartPoint[]; usedFallback: boolean } {
  const chronological = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const cutoff = Date.now() - PERIOD_MS[period];
  const inPeriod = chronological.filter(
    (a) => new Date(a.createdAt).getTime() >= cutoff,
  );

  const source = inPeriod.length > 0 ? inPeriod : chronological;
  const usedFallback = inPeriod.length === 0 && chronological.length > 0;

  return {
    points: source.slice(-maxBars).map((a) => ({
      score: a.overallScore || 0,
      date: a.createdAt,
    })),
    usedFallback,
  };
}

export function formatChartDate(iso: string, barCount: number): string {
  const date = new Date(iso);
  if (barCount <= 3) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}
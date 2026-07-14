export type ChartPeriod = 'День' | 'Неделя' | 'Месяц' | 'Год';

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
): { values: number[]; usedFallback: boolean } {
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
    values: source.slice(-maxBars).map((a) => a.overallScore || 0),
    usedFallback,
  };
}

export function chartHint(count: number, usedFallback: boolean, period: ChartPeriod): string | null {
  if (count === 0) return null;
  if (usedFallback) {
    return `За период «${period.toLowerCase()}» нет чек-инов · показаны все`;
  }
  if (count === 1) {
    return 'Первый чек-ин · следующие анализы покажут динамику';
  }
  if (count < 4) {
    return `${count} чек-ина · график станет нагляднее с каждым анализом`;
  }
  return null;
}
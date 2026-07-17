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

function startOfLocalDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function startOfLocalWeek(date: Date): Date {
  const day = startOfLocalDay(date);
  const weekday = day.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  day.setDate(day.getDate() + mondayOffset);
  return day;
}

function toPoint(analysis: ScoredAnalysis): ChartPoint {
  return {
    score: analysis.overallScore || 0,
    date: analysis.createdAt,
  };
}

function aggregateByBucket(
  analyses: ScoredAnalysis[],
  bucketKey: (date: Date) => string,
  maxBars: number,
): ChartPoint[] {
  const buckets = new Map<string, ScoredAnalysis>();

  for (const analysis of analyses) {
    const key = bucketKey(new Date(analysis.createdAt));
    buckets.set(key, analysis);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-maxBars)
    .map(([, analysis]) => toPoint(analysis));
}

export function scoresForPeriod(
  analyses: ScoredAnalysis[],
  period: ChartPeriod,
  maxBars = 10,
): { points: ChartPoint[]; usedFallback: boolean } {
  const chronological = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (chronological.length === 0) {
    return { points: [], usedFallback: false };
  }

  const cutoff = Date.now() - PERIOD_MS[period];
  const inPeriod = chronological.filter(
    (analysis) => new Date(analysis.createdAt).getTime() >= cutoff,
  );

  if (inPeriod.length === 0) {
    return { points: [], usedFallback: false };
  }

  let points: ChartPoint[];

  if (period === 'День') {
    points = inPeriod.slice(-maxBars).map(toPoint);
  } else if (period === 'Неделя' || period === 'Месяц') {
    points = aggregateByBucket(
      inPeriod,
      (date) => startOfLocalDay(date).toISOString().slice(0, 10),
      maxBars,
    );
  } else {
    points = aggregateByBucket(
      inPeriod,
      (date) => startOfLocalWeek(date).toISOString().slice(0, 10),
      maxBars,
    );
  }

  return { points, usedFallback: false };
}

export function formatChartDate(
  iso: string,
  period: ChartPeriod,
  barCount: number,
): string {
  const date = new Date(iso);

  if (period === 'День') {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  if (barCount <= 3) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}
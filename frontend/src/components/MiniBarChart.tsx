import { ChartPeriod, ChartPoint, formatChartDate } from '@/utils/progressChart';

interface MiniBarChartProps {
  points: ChartPoint[];
  period?: ChartPeriod;
  max?: number;
}

const MAX_BARS = 10;

export default function MiniBarChart({ points, period = 'Месяц', max = 100 }: MiniBarChartProps) {
  if (points.length === 0) {
    return (
      <p className="anim-fade-in text-[13px] leading-relaxed text-app-muted">
        Нет данных за выбранный период
      </p>
    );
  }

  const displayPoints = points.slice(-MAX_BARS);
  const count = displayPoints.length;
  // Scale heights to the tallest score in this series so the chart fills the lane
  const seriesPeak = Math.max(
    1,
    ...displayPoints.map((p) => p.score || 0),
    Math.min(max, 40),
  );

  return (
    <div
      key={`${period}-${displayPoints.map((p) => `${p.date}-${p.score}`).join('|')}`}
      className="grid w-full gap-2"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`График баллов: ${displayPoints.map((p) => p.score).join(', ')}`}
    >
      {displayPoints.map((point, dataIndex) => {
        const isLatest = dataIndex === count - 1;
        const score = point.score || 0;
        // 32–100% of track so short scores still look like bars, not dots
        const heightPct = 32 + (score / seriesPeak) * 68;

        return (
          <div
            key={`${point.date}-${point.score}-${dataIndex}`}
            className="flex min-w-0 flex-col items-center"
          >
            <span
              className={`mb-1.5 text-[12px] font-bold leading-none tabular-nums ${
                isLatest ? 'text-app-text' : 'text-app-muted'
              }`}
            >
              {score}
            </span>

            <div className="flex h-[5.5rem] w-full items-end justify-center rounded-2xl bg-app-surface/50 px-1 pt-2">
              <div
                className={`chart-bar w-full max-w-[2rem] rounded-full bg-brand-green ${
                  isLatest ? 'ring-2 ring-brand-greenDark/25 ring-offset-1 ring-offset-transparent' : ''
                }`}
                style={{
                  height: `${heightPct}%`,
                  ['--bar-opacity' as string]: '1',
                  ['--bar-delay' as string]: `${dataIndex * 40}ms`,
                }}
              />
            </div>

            <span className="mt-2 w-full truncate text-center text-[11px] leading-tight text-app-muted">
              {formatChartDate(point.date, period, count)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

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

  return (
    <div
      key={`${period}-${displayPoints.map((p) => `${p.date}-${p.score}`).join('|')}`}
      className="grid w-full gap-1.5"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`График баллов: ${displayPoints.map((p) => p.score).join(', ')}`}
    >
      {displayPoints.map((point, dataIndex) => {
        const isLatest = dataIndex === count - 1;
        const height = Math.max(24, (point.score / max) * 100);
        const progress = (dataIndex + 1) / count;
        const opacity = isLatest ? 1 : 0.35 + progress * 0.4;

        return (
          <div
            key={`${point.date}-${point.score}-${dataIndex}`}
            className="flex min-w-0 flex-col items-center"
          >
            <span
              className={`mb-1 text-[12px] font-bold leading-none tabular-nums transition-colors duration-200 ${
                isLatest ? 'text-app-text' : 'text-app-muted'
              }`}
            >
              {point.score}
            </span>

            <div className="flex h-20 w-full items-end justify-center">
              <div
                className={`chart-bar w-full rounded-full ${
                  count <= 3 ? 'max-w-12' : count <= 6 ? 'max-w-9' : 'max-w-7'
                } ${
                  isLatest
                    ? 'bg-gradient-to-t from-brand-green to-brand-green/70'
                    : 'bg-brand-green'
                }`}
                style={{
                  height: `${height}%`,
                  ['--bar-opacity' as string]: String(opacity),
                  ['--bar-delay' as string]: `${dataIndex * 45}ms`,
                }}
              />
            </div>

            <span className="mt-1.5 w-full truncate text-center text-[11px] leading-tight text-app-muted">
              {formatChartDate(point.date, period, count)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

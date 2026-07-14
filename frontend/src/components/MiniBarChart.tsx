import { ChartPoint, formatChartDate } from '@/utils/progressChart';

interface MiniBarChartProps {
  points: ChartPoint[];
  max?: number;
}

export default function MiniBarChart({ points, max = 100 }: MiniBarChartProps) {
  if (points.length === 0) {
    return (
      <p className="text-[13px] text-app-muted leading-relaxed">
        Нет данных за выбранный период
      </p>
    );
  }

  const count = points.length;
  const single = count === 1;

  return (
    <div
      className={`flex w-full items-end gap-2 ${single ? 'justify-end' : 'justify-between'}`}
      role="img"
      aria-label={`График баллов: ${points.map((p) => p.score).join(', ')}`}
    >
      {points.map((point, i) => {
        const height = Math.max(22, (point.score / max) * 100);
        const isLatest = i === count - 1;
        const progress = (i + 1) / count;
        const opacity = isLatest ? 1 : 0.3 + progress * 0.45;

        return (
          <div
            key={`${point.date}-${point.score}`}
            className={`flex min-w-0 flex-col items-center ${single ? 'w-16' : 'flex-1'}`}
          >
            <span
              className={`mb-1.5 text-[11px] font-bold leading-none tabular-nums ${
                isLatest ? 'text-app-text' : 'text-app-muted'
              }`}
            >
              {point.score}
            </span>

            <div className="flex h-24 w-full items-end">
              <div
                className={`mx-auto w-full max-w-[28px] rounded-full transition-all ${
                  isLatest
                    ? 'bg-gradient-to-t from-brand-green to-brand-green/70'
                    : 'bg-brand-green'
                }`}
                style={{ height: `${height}%`, opacity }}
              />
            </div>

            <span className="mt-2 max-w-full truncate text-center text-[10px] leading-tight text-app-muted">
              {formatChartDate(point.date, count)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
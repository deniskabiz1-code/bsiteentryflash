import { ChartPoint, formatChartDate } from '@/utils/progressChart';

interface MiniBarChartProps {
  points: ChartPoint[];
  max?: number;
}

const MAX_SLOTS = 10;

export default function MiniBarChart({ points, max = 100 }: MiniBarChartProps) {
  if (points.length === 0) {
    return (
      <p className="text-[13px] text-app-muted leading-relaxed">
        Нет данных за выбранный период
      </p>
    );
  }

  const count = points.length;
  const slots: (ChartPoint | null)[] = Array.from({ length: MAX_SLOTS }, (_, index) => {
    const dataIndex = index - (MAX_SLOTS - count);
    return dataIndex >= 0 ? points[dataIndex] : null;
  });

  return (
    <div
      className="grid w-full grid-cols-10 gap-0.5"
      role="img"
      aria-label={`График баллов: ${points.map((p) => p.score).join(', ')}`}
    >
      {slots.map((point, slotIndex) => {
        if (!point) {
          return <div key={`empty-${slotIndex}`} className="min-h-[7.5rem]" aria-hidden />;
        }

        const dataIndex = slotIndex - (MAX_SLOTS - count);
        const isLatest = dataIndex === count - 1;
        const height = Math.max(24, (point.score / max) * 100);
        const progress = (dataIndex + 1) / count;
        const opacity = isLatest ? 1 : 0.35 + progress * 0.4;

        return (
          <div
            key={`${point.date}-${point.score}`}
            className="flex min-w-0 flex-col items-center"
          >
            <span
              className={`mb-1 text-[12px] font-bold leading-none tabular-nums ${
                isLatest ? 'text-app-text' : 'text-app-muted'
              }`}
            >
              {point.score}
            </span>

            <div className="flex h-20 w-full items-end justify-center">
              <div
                className={`w-full max-w-[22px] rounded-full ${
                  isLatest
                    ? 'bg-gradient-to-t from-brand-green to-brand-green/70'
                    : 'bg-brand-green'
                }`}
                style={{ height: `${height}%`, opacity }}
              />
            </div>

            <span className="mt-1.5 w-full truncate text-center text-[11px] leading-tight text-app-muted">
              {formatChartDate(point.date, count)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
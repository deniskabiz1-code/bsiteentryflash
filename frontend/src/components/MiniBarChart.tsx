import { ChartPeriod, ChartPoint, formatChartDate } from '@/utils/progressChart';

interface MiniBarChartProps {
  points: ChartPoint[];
  period?: ChartPeriod;
  max?: number;
}

const MAX_BARS = 10;

/** Fixed column width keeps bars chunky without stretching across empty space. */
function layoutForCount(count: number): { barPx: number; colPx: number; gapPx: number } {
  if (count <= 3) return { barPx: 22, colPx: 52, gapPx: 10 };
  if (count <= 5) return { barPx: 18, colPx: 44, gapPx: 8 };
  if (count <= 7) return { barPx: 15, colPx: 38, gapPx: 6 };
  return { barPx: 12, colPx: 32, gapPx: 4 };
}

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
  const { barPx, colPx, gapPx } = layoutForCount(count);

  return (
    <div
      key={`${period}-${displayPoints.map((p) => `${p.date}-${p.score}`).join('|')}`}
      className="flex w-full items-end justify-center"
      style={{ gap: gapPx }}
      role="img"
      aria-label={`График баллов: ${displayPoints.map((p) => p.score).join(', ')}`}
    >
      {displayPoints.map((point, dataIndex) => {
        const isLatest = dataIndex === count - 1;
        const heightPct = Math.max(28, (point.score / max) * 100);
        // Older bars slightly softer; latest always full solid green (no transparent gradient)
        const opacity = isLatest ? 1 : 0.45 + ((dataIndex + 1) / count) * 0.4;

        return (
          <div
            key={`${point.date}-${point.score}-${dataIndex}`}
            className="flex shrink-0 flex-col items-center"
            style={{ width: colPx }}
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
                className={`chart-bar rounded-full ${
                  isLatest ? 'bg-brand-greenDark' : 'bg-brand-green'
                }`}
                style={{
                  width: barPx,
                  height: `${heightPct}%`,
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

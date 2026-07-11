interface MiniBarChartProps {
  values: number[];
  max?: number;
}

export default function MiniBarChart({ values, max = 100 }: MiniBarChartProps) {
  return (
    <div className="flex items-end justify-between gap-1.5 h-28 pt-2">
      {values.map((value, i) => {
        const height = Math.max(12, (value / max) * 100);
        const faded = i < values.length - 4;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <div
              className={`w-full rounded-full transition-all ${
                faded
                  ? 'bg-accent-teal/20'
                  : 'bg-gradient-to-t from-accent-teal via-brand-green to-accent-coral'
              }`}
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
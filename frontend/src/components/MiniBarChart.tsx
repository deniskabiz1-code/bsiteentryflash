interface MiniBarChartProps {
  values: number[];
  max?: number;
  hint?: string | null;
}

export default function MiniBarChart({ values, max = 100, hint }: MiniBarChartProps) {
  if (values.length === 0) {
    return (
      <p className="text-[13px] text-app-muted leading-relaxed">
        Нет данных за выбранный период
      </p>
    );
  }

  const count = values.length;
  const single = count === 1;

  return (
    <div>
      <div
        className={`flex h-28 items-end gap-2 pt-2 ${single ? 'justify-center' : 'justify-between'}`}
        role="img"
        aria-label={`График баллов: ${values.join(', ')}`}
      >
        {values.map((value, i) => {
          const height = Math.max(18, (value / max) * 100);
          const progress = (i + 1) / count;
          const faded = !single && i < count - 1;
          const opacity = faded ? 0.28 + progress * 0.45 : 1;

          return (
            <div
              key={`${i}-${value}`}
              className={`flex h-full flex-col items-center justify-end ${single ? 'w-14' : 'min-w-0 flex-1'}`}
            >
              <div
                className={`w-full rounded-full transition-all ${
                  faded ? 'bg-brand-green' : 'bg-gradient-to-t from-brand-green to-brand-green/70'
                }`}
                style={{ height: `${height}%`, opacity }}
              />
            </div>
          );
        })}
      </div>

      {hint && (
        <p className="mt-3 text-center text-[13px] leading-snug text-app-muted">{hint}</p>
      )}
    </div>
  );
}
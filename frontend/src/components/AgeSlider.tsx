interface AgeSliderProps {
  value: number;
  min?: number;
  max?: number;
  compact?: boolean;
  onChange: (value: number) => void;
}

export default function AgeSlider({ value, min = 14, max = 60, compact, onChange }: AgeSliderProps) {
  const handleChange = (next: string) => {
    const parsed = parseInt(next, 10);
    if (!Number.isNaN(parsed)) onChange(parsed);
  };

  return (
    <div className="w-full text-left" data-touch-interactive>
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-3'}`}>
        <span className="text-[15px] font-semibold text-app-text">Возраст</span>
        <span className={`font-bold leading-none tabular-nums ${compact ? 'text-[22px]' : 'text-[28px]'}`}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onInput={(e) => handleChange(e.currentTarget.value)}
        onChange={(e) => handleChange(e.target.value)}
        className="age-slider w-full"
        aria-label="Возраст"
      />
      <div className="flex justify-between mt-2 text-[12px] text-app-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
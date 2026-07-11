interface AgeSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export default function AgeSlider({ value, min = 14, max = 60, onChange }: AgeSliderProps) {
  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-semibold text-app-text">Возраст</span>
        <span className="text-[28px] font-bold leading-none tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
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
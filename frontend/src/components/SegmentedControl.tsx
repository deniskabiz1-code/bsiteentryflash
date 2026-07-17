interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="segmented relative z-10">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          data-touch-interactive
          onClick={() => onChange(opt)}
          className={`segmented-item ${value === opt ? 'segmented-item-active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
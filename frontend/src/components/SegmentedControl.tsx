interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="segmented">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`segmented-item ${value === opt ? 'segmented-item-active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
interface ScoreCircleProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ScoreCircle({ score, size = 120, label }: ScoreCircleProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#34C759' : score >= 50 ? '#FF9F0A' : '#FF3B30';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--app-border)" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-app-text tracking-tight">{score}</span>
          <span className="text-xs text-app-muted font-medium">/100</span>
        </div>
      </div>
      {label && <span className="text-sm text-app-muted font-medium">{label}</span>}
    </div>
  );
}
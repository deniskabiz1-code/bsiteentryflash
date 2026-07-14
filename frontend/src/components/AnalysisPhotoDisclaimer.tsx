type AnalysisPhotoDisclaimerProps = {
  className?: string;
  compact?: boolean;
};

export default function AnalysisPhotoDisclaimer({
  className = '',
  compact = false,
}: AnalysisPhotoDisclaimerProps) {
  return (
    <p className={`leading-snug text-app-muted ${compact ? 'text-[11px]' : 'text-[12px]'} ${className}`}>
      {compact
        ? 'Баллы зависят от освещения, ракурса и положения камеры.'
        : 'Оценка сильно зависит от освещения, положения камеры и угла съёмки. Для сравнения прогресса снимайтесь в похожих условиях.'}
    </p>
  );
}
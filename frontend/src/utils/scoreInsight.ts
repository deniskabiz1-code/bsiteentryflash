export function scoreInsightLabel(score: number): string {
  if (score >= 82) return 'Сильная сторона';
  if (score >= 72) return 'Хорошо';
  if (score >= 58) return 'Есть потенциал';
  return 'Зона роста';
}

export function scoreInsightTone(score: number): string {
  if (score >= 82) return 'text-brand-greenDark';
  if (score >= 72) return 'text-brand-greenDark';
  if (score >= 58) return 'text-app-text';
  return 'text-amber-700';
}

export function scoreBarTone(score: number): string {
  if (score >= 72) return 'bg-brand-green';
  if (score >= 58) return 'bg-amber-400';
  return 'bg-amber-600';
}
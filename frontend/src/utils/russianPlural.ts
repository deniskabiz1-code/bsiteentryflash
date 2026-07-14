/** Russian plural for «балл»: 1 балл, 2 балла, 5 баллов, 73 балла */
export function pluralizeBalls(count: number): string {
  const n = Math.abs(Math.trunc(count));
  const mod100 = n % 100;
  const mod10 = n % 10;

  if (mod100 >= 11 && mod100 <= 14) return 'баллов';
  if (mod10 === 1) return 'балл';
  if (mod10 >= 2 && mod10 <= 4) return 'балла';
  return 'баллов';
}

export function formatScoreWithBalls(count: number): string {
  return `${count} ${pluralizeBalls(count)}`;
}
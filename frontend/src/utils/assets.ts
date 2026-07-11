const apiUrl = import.meta.env.VITE_API_URL || '';

export function assetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const origin = apiUrl.replace(/\/api\/?$/, '');
  return `${origin}${path}`;
}
export const DEFAULT_CHANNEL_USERNAME =
  (import.meta.env.VITE_CHANNEL_USERNAME || 'primeformnews').replace(/^@/, '');

export const DEFAULT_CHANNEL_URL = `https://t.me/${DEFAULT_CHANNEL_USERNAME}`;
export const BOT_USERNAME =
  (import.meta.env.VITE_BOT_USERNAME || 'primeform_app_bot').replace(/^@/, '');

export const BOT_HANDLE = `@${BOT_USERNAME}`;
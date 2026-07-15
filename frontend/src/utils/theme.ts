import { getTgWebApp } from '@/lib/tgWebApp';

const STORAGE_KEY = 'primeform_dark_theme';

export function readDarkThemePreference(): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === '0') return false;
    if (raw === '1') return true;
  } catch {
    // ignore
  }
  return null;
}

export function writeDarkThemePreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export function resolveDarkTheme(
  serverValue: boolean | undefined | null,
  fallback = false,
): boolean {
  const local = readDarkThemePreference();
  if (local !== null) return local;
  if (serverValue === true) return true;
  if (serverValue === false) return false;
  return fallback;
}

const LIGHT_COLORS = {
  header: '#F5F5F7',
  background: '#F5F5F7',
};

const DARK_COLORS = {
  header: '#000000',
  background: '#000000',
};

export function applyTheme(dark: boolean): void {
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';

  const colors = dark ? DARK_COLORS : LIGHT_COLORS;
  const webApp = getTgWebApp();
  webApp?.setHeaderColor?.(colors.header);
  webApp?.setBackgroundColor?.(colors.background);
}
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

export function normalizeDarkTheme(value: boolean | undefined | null, fallback = false): boolean {
  return value === true;
}

export function resolveDarkTheme(
  serverValue: boolean | undefined | null,
  fallback = false,
): boolean {
  const local = readDarkThemePreference();
  if (local !== null) return local;
  return normalizeDarkTheme(serverValue, fallback);
}

/** True while a dark-theme toggle API call is in flight (refresh should not overwrite). */
let darkThemeSaveDepth = 0;

export function beginDarkThemeSave(): void {
  darkThemeSaveDepth += 1;
}

export function endDarkThemeSave(): void {
  darkThemeSaveDepth = Math.max(0, darkThemeSaveDepth - 1);
}

export function isDarkThemeSaveInFlight(): boolean {
  return darkThemeSaveDepth > 0;
}

export function syncDarkThemeFromServer(
  serverValue: boolean | undefined | null,
  preserveInFlightValue?: boolean | null,
): boolean {
  const darkTheme = preserveInFlightValue === true || preserveInFlightValue === false
    ? preserveInFlightValue
    : normalizeDarkTheme(serverValue);
  writeDarkThemePreference(darkTheme);
  applyTheme(darkTheme);
  return darkTheme;
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
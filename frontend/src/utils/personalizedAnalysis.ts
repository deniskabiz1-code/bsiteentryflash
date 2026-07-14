const STORAGE_KEY = 'primeform_personalized_analysis';

export function readPersonalizedAnalysisPreference(): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === '0') return false;
    if (raw === '1') return true;
  } catch {
    // ignore
  }
  return null;
}

export function writePersonalizedAnalysisPreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export function resolvePersonalizedAnalysis(
  serverValue: boolean | undefined | null,
  fallback = true,
): boolean {
  const local = readPersonalizedAnalysisPreference();
  if (local !== null) return local;
  if (serverValue === false) return false;
  if (serverValue === true) return true;
  return fallback;
}
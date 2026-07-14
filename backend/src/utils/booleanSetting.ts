export function parseBooleanSetting(value: unknown): boolean | null {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return null;
}

export function wantsPersonalizedAnalysis(
  storedPreference: boolean | null | undefined,
  requestValue: unknown,
): boolean {
  const parsedRequest = parseBooleanSetting(requestValue);
  if (parsedRequest !== null) return parsedRequest;
  return storedPreference !== false;
}
const FALLBACK_TZ = 'Europe/Moscow';

export function getDeviceTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();
    return tz && isValidTimezone(tz) ? tz : FALLBACK_TZ;
  } catch {
    return FALLBACK_TZ;
  }
}

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Human-readable label for the reminder time field. */
export function formatTimezoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('ru-RU', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value;
    const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
    return offset ? `${city} · ${offset}` : city;
  } catch {
    return tz.replace(/_/g, ' ');
  }
}
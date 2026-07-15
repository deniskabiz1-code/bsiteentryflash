import { useState } from 'react';
import { updateDarkTheme } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import {
  beginDarkThemeSave,
  endDarkThemeSave,
  normalizeDarkTheme,
  syncDarkThemeFromServer,
} from '@/utils/theme';

function resolveSavedDarkTheme(
  responseValue: boolean | undefined | null,
  requested: boolean,
): boolean {
  if (responseValue === true) return true;
  if (responseValue === false) return false;
  return requested;
}

export function useDarkThemeToggle() {
  const { user, applyUser } = useApp();
  const { haptic } = useTelegram();
  const [saving, setSaving] = useState(false);

  const enabled = normalizeDarkTheme(user?.darkTheme);

  const toggle = async () => {
    if (!user || saving) return;

    const newVal = !enabled;
    syncDarkThemeFromServer(newVal);
    applyUser({ ...user, darkTheme: newVal });

    setSaving(true);
    beginDarkThemeSave();
    try {
      const data = await updateDarkTheme(newVal);
      const saved = resolveSavedDarkTheme(data.darkTheme, newVal);
      if (saved === newVal) {
        syncDarkThemeFromServer(saved);
        if (data.user) {
          applyUser({ ...data.user, darkTheme: saved });
        } else {
          applyUser({ ...user, darkTheme: saved });
        }
        haptic('light');
      } else {
        console.warn('Dark theme API returned unexpected value:', data.darkTheme);
        haptic('error');
      }
    } catch (err) {
      console.error('Dark theme save failed:', err);
      haptic('error');
    } finally {
      endDarkThemeSave();
      setSaving(false);
    }
  };

  return { enabled, toggle, saving };
}
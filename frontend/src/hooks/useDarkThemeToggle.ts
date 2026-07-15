import { updateDarkTheme } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import {
  applyTheme,
  normalizeDarkTheme,
  writeDarkThemePreference,
} from '@/utils/theme';

export function useDarkThemeToggle() {
  const { user, applyUser } = useApp();
  const { haptic } = useTelegram();

  const enabled = normalizeDarkTheme(user?.darkTheme);

  const toggle = async () => {
    if (!user) return;

    const newVal = !enabled;
    writeDarkThemePreference(newVal);
    applyTheme(newVal);
    applyUser({ ...user, darkTheme: newVal });

    try {
      const data = await updateDarkTheme(newVal);
      const saved = normalizeDarkTheme(data.darkTheme);
      writeDarkThemePreference(saved);
      applyTheme(saved);
      if (data.user) {
        applyUser({ ...data.user, darkTheme: saved });
      } else {
        applyUser({ ...user, darkTheme: saved });
      }
      haptic('light');
    } catch (err) {
      console.error('Dark theme save failed:', err);
      haptic('error');
    }
  };

  return { enabled, toggle };
}
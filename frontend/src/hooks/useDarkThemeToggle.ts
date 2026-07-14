import { updateDarkTheme } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import {
  applyTheme,
  resolveDarkTheme,
  writeDarkThemePreference,
} from '@/utils/theme';

export function useDarkThemeToggle(onSubscribe?: () => void) {
  const { user, applyUser } = useApp();
  const { haptic } = useTelegram();

  const subscribed = Boolean(user?.subscriptionActive);
  const enabled = resolveDarkTheme(user?.darkTheme, subscribed);

  const toggle = async () => {
    if (!user) return;

    if (!subscribed) {
      haptic('error');
      onSubscribe?.();
      return;
    }

    const newVal = !enabled;
    writeDarkThemePreference(newVal);
    applyTheme(newVal);
    applyUser({ ...user, darkTheme: newVal });

    try {
      const data = await updateDarkTheme(newVal);
      const saved = data.darkTheme === true;
      writeDarkThemePreference(saved);
      applyTheme(saved);
      if (data.user) {
        applyUser({ ...data.user, darkTheme: saved });
      } else {
        applyUser({ ...user, darkTheme: saved });
      }
      haptic('light');
    } catch {
      const reverted = !newVal;
      writeDarkThemePreference(reverted);
      applyTheme(reverted);
      applyUser({ ...user, darkTheme: reverted });
      haptic('error');
    }
  };

  return { enabled, subscribed, toggle };
}
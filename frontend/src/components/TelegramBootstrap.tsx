import { useEffect } from 'react';
import {
  ensureTelegramViewportExpanded,
  initTelegramWebApp,
  syncTelegramSafeAreaInsets,
  syncViewportMetrics,
} from '@/lib/tgWebApp';
import { applyTheme, readDarkThemePreference } from '@/utils/theme';

export default function TelegramBootstrap() {
  useEffect(() => {
    initTelegramWebApp();

    const storedTheme = readDarkThemePreference();
    if (storedTheme !== null) {
      applyTheme(storedTheme);
    }

    const sync = () => {
      ensureTelegramViewportExpanded();
      syncTelegramSafeAreaInsets();
      syncViewportMetrics();
    };

    const retries = [50, 150, 400, 900].map((ms) =>
      window.setTimeout(sync, ms)
    );

    window.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('resize', sync);
    return () => {
      retries.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('resize', sync);
    };
  }, []);

  return null;
}
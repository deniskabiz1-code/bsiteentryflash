import { useEffect } from 'react';
import { initTelegramWebApp, syncTelegramSafeAreaInsets, syncViewportMetrics } from '@/lib/tgWebApp';

export default function TelegramBootstrap() {
  useEffect(() => {
    initTelegramWebApp();

    const sync = () => {
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
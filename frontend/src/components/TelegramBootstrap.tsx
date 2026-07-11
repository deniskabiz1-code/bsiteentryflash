import { useEffect } from 'react';
import { initTelegramWebApp, syncTelegramSafeAreaInsets } from '@/lib/tgWebApp';

export default function TelegramBootstrap() {
  useEffect(() => {
    initTelegramWebApp();

    const retries = [50, 150, 400].map((ms) =>
      window.setTimeout(() => syncTelegramSafeAreaInsets(), ms)
    );

    const onResize = () => syncTelegramSafeAreaInsets();
    window.addEventListener('resize', onResize);
    return () => {
      retries.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
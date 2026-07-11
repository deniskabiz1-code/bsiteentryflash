import { useEffect } from 'react';
import { initTelegramWebApp, syncTelegramSafeAreaInsets } from '@/lib/tgWebApp';

export default function TelegramBootstrap() {
  useEffect(() => {
    initTelegramWebApp();

    const onResize = () => syncTelegramSafeAreaInsets();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return null;
}
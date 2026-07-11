import { useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';

export function useTelegram() {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('#F5F5F7');
    WebApp.setBackgroundColor('#F5F5F7');
  }, []);

  const openLink = useCallback((url: string) => {
    WebApp.openLink(url);
  }, []);

  const openTelegramLink = useCallback((url: string) => {
    let normalized = url.trim();
    if (normalized.startsWith('http://')) {
      normalized = normalized.replace('http://', 'https://');
    } else if (normalized.startsWith('t.me/')) {
      normalized = `https://${normalized}`;
    } else if (normalized.startsWith('@')) {
      normalized = `https://t.me/${normalized.slice(1)}`;
    } else if (!normalized.startsWith('https://')) {
      normalized = `https://t.me/${normalized.replace(/^@/, '')}`;
    }
    normalized = normalized.replace('https://telegram.me/', 'https://t.me/');

    try {
      WebApp.openTelegramLink(normalized);
    } catch (err) {
      console.error('openTelegramLink failed:', err);
      const tgWebApp = (window as Window & { Telegram?: { WebApp?: { openTelegramLink?: (u: string) => void } } })
        .Telegram?.WebApp;
      if (tgWebApp?.openTelegramLink) {
        tgWebApp.openTelegramLink(normalized);
      }
    }
  }, []);

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (type === 'success' || type === 'error') {
      WebApp.HapticFeedback.notificationOccurred(type);
    } else {
      WebApp.HapticFeedback.impactOccurred(type);
    }
  }, []);

  const showBackButton = useCallback((onClick: () => void) => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(onClick);
    return () => {
      WebApp.BackButton.offClick(onClick);
      WebApp.BackButton.hide();
    };
  }, []);

  const showMainButton = useCallback(
    (text: string, onClick: () => void, options?: { disabled?: boolean }) => {
      WebApp.MainButton.setText(text);
      WebApp.MainButton.show();
      if (options?.disabled) {
        WebApp.MainButton.disable();
      } else {
        WebApp.MainButton.enable();
      }
      WebApp.MainButton.onClick(onClick);
      return () => {
        WebApp.MainButton.offClick(onClick);
        WebApp.MainButton.hide();
      };
    },
    []
  );

  return {
    user: WebApp.initDataUnsafe.user,
    openLink,
    openTelegramLink,
    haptic,
    showBackButton,
    showMainButton,
    close: () => WebApp.close(),
  };
}
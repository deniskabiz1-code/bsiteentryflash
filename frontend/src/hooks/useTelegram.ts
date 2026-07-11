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
    if (url.includes('t.me/') && WebApp.openTelegramLink) {
      WebApp.openTelegramLink(url);
    } else {
      WebApp.openLink(url);
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
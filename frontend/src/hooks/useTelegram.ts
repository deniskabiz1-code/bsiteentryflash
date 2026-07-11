import { useCallback } from 'react';
import { getTgWebApp, openTmeLink } from '@/lib/tgWebApp';

export function useTelegram() {

  const openLink = useCallback((url: string) => {
    getTgWebApp()?.openLink(url);
  }, []);

  const openTelegramLink = useCallback((url: string, usernameFallback?: string) => {
    openTmeLink(url, usernameFallback);
  }, []);

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    const webApp = getTgWebApp();
    if (!webApp) return;
    if (type === 'success' || type === 'error') {
      webApp.HapticFeedback.notificationOccurred(type);
    } else {
      webApp.HapticFeedback.impactOccurred(type);
    }
  }, []);

  const showBackButton = useCallback((onClick: () => void) => {
    const webApp = getTgWebApp();
    if (!webApp) return () => {};
    webApp.BackButton.show();
    webApp.BackButton.onClick(onClick);
    return () => {
      webApp.BackButton.offClick(onClick);
      webApp.BackButton.hide();
    };
  }, []);

  const showMainButton = useCallback(
    (text: string, onClick: () => void, options?: { disabled?: boolean }) => {
      const webApp = getTgWebApp();
      if (!webApp) return () => {};
      webApp.MainButton.setText(text);
      webApp.MainButton.show();
      if (options?.disabled) {
        webApp.MainButton.disable();
      } else {
        webApp.MainButton.enable();
      }
      webApp.MainButton.onClick(onClick);
      return () => {
        webApp.MainButton.offClick(onClick);
        webApp.MainButton.hide();
      };
    },
    []
  );

  const webApp = getTgWebApp();

  return {
    user: webApp?.initDataUnsafe.user,
    openLink,
    openTelegramLink,
    haptic,
    showBackButton,
    showMainButton,
    close: () => webApp?.close(),
  };
}
type TgWebApp = {
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };
  };
  onEvent: (event: string, handler: () => void) => void;
  offEvent: (event: string, handler: () => void) => void;
  HapticFeedback: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
};

type TgWebView = {
  postEvent: (eventType: string, callback: (() => void) | false, eventData: unknown) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TgWebApp;
      WebView?: TgWebView;
    };
    TelegramWebviewProxy?: {
      postEvent: (eventType: string, eventData: string) => void;
    };
  }
}

export function getTgWebApp(): TgWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function normalizeTmeUrl(url: string, usernameFallback?: string): string {
  let normalized = url?.trim() || '';
  if (!normalized && usernameFallback) {
    normalized = `https://t.me/${usernameFallback.replace(/^@/, '')}`;
  }
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://');
  } else if (normalized.startsWith('t.me/')) {
    normalized = `https://${normalized}`;
  } else if (normalized.startsWith('@')) {
    normalized = `https://t.me/${normalized.slice(1)}`;
  } else if (!normalized.startsWith('https://')) {
    normalized = `https://t.me/${normalized.replace(/^@/, '')}`;
  }
  return normalized.replace('https://telegram.me/', 'https://t.me/');
}

/** Opens a t.me link inside Telegram — never uses external browser. */
export function openTmeLink(url: string, usernameFallback?: string): void {
  const normalized = normalizeTmeUrl(url, usernameFallback);
  const webApp = getTgWebApp();

  if (webApp?.openTelegramLink) {
    try {
      webApp.openTelegramLink(normalized);
      return;
    } catch (err) {
      console.error('openTelegramLink failed:', err);
    }
  }

  const anchor = document.createElement('a');
  anchor.href = normalized;
  if (anchor.hostname !== 't.me') {
    console.error('Invalid Telegram URL:', normalized);
    return;
  }

  const pathFull = anchor.pathname + anchor.search;
  const payload = { path_full: pathFull };

  if (window.TelegramWebviewProxy?.postEvent) {
    window.TelegramWebviewProxy.postEvent('web_app_open_tg_link', JSON.stringify(payload));
    return;
  }

  if (window.Telegram?.WebView?.postEvent) {
    window.Telegram.WebView.postEvent('web_app_open_tg_link', false, payload);
    return;
  }

  console.warn('Telegram WebApp bridge unavailable');
}
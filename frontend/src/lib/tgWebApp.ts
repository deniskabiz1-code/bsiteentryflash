type SafeAreaInset = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type TgWebApp = {
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  platform?: string;
  safeAreaInset?: SafeAreaInset;
  contentSafeAreaInset?: SafeAreaInset;
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

const EMPTY_INSET: SafeAreaInset = { top: 0, bottom: 0, left: 0, right: 0 };
/** Telegram "Закрыть" header row below the status bar. */
const TG_HEADER_BAR_PX = 52;
/** Minimum top offset on phones (status bar + header). */
const TG_MIN_CONTENT_TOP_PX = 96;

function resolveContentTopInset(webApp: TgWebApp): number {
  const safe = webApp.safeAreaInset ?? EMPTY_INSET;
  const content = webApp.contentSafeAreaInset ?? EMPTY_INSET;

  // contentSafeAreaInset can under-report on some clients — always reserve header space.
  const withHeader = safe.top + TG_HEADER_BAR_PX;
  return Math.max(content.top, withHeader, TG_MIN_CONTENT_TOP_PX);
}

export function syncTelegramSafeAreaInsets(): void {
  const webApp = getTgWebApp();
  const root = document.documentElement;

  if (!webApp) {
    delete root.dataset.tg;
    root.style.setProperty('--tg-content-safe-area-inset-top', '0px');
    root.style.setProperty('--tg-content-safe-area-inset-bottom', '0px');
    root.style.setProperty('--tg-content-safe-area-inset-left', '0px');
    root.style.setProperty('--tg-content-safe-area-inset-right', '0px');
    return;
  }

  root.dataset.tg = '1';

  const safe = webApp.safeAreaInset ?? EMPTY_INSET;
  const content = webApp.contentSafeAreaInset ?? EMPTY_INSET;
  const contentTop = resolveContentTopInset(webApp);

  root.style.setProperty('--tg-safe-area-inset-top', `${safe.top}px`);
  root.style.setProperty('--tg-safe-area-inset-bottom', `${safe.bottom}px`);
  root.style.setProperty('--tg-safe-area-inset-left', `${safe.left}px`);
  root.style.setProperty('--tg-safe-area-inset-right', `${safe.right}px`);
  root.style.setProperty('--tg-content-safe-area-inset-top', `${contentTop}px`);
  root.style.setProperty('--tg-content-safe-area-inset-bottom', `${content.bottom}px`);
  root.style.setProperty('--tg-content-safe-area-inset-left', `${content.left}px`);
  root.style.setProperty('--tg-content-safe-area-inset-right', `${content.right}px`);
}

let safeAreaListenersBound = false;

function bindSafeAreaListeners(): void {
  if (safeAreaListenersBound) return;
  const webApp = getTgWebApp();
  if (!webApp) return;

  const sync = () => syncTelegramSafeAreaInsets();
  webApp.onEvent('safeAreaChanged', sync);
  webApp.onEvent('contentSafeAreaChanged', sync);
  safeAreaListenersBound = true;
}

export function initTelegramWebApp(): void {
  const webApp = getTgWebApp();
  if (!webApp) return;

  webApp.ready();
  webApp.expand();
  webApp.setHeaderColor('#F5F5F7');
  webApp.setBackgroundColor('#F5F5F7');
  syncTelegramSafeAreaInsets();
  bindSafeAreaListeners();
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
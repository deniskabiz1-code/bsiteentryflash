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
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
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
const TG_HEADER_BAR_PX = 56;
/** Minimum top offset on phones (status bar + header). */
const TG_MIN_CONTENT_TOP_PX = 120;

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
  syncViewportMetrics();
}

function readViewportHeight(webApp?: TgWebApp): number {
  if (webApp?.viewportHeight && webApp.viewportHeight > 0) {
    return webApp.viewportHeight;
  }
  if (window.visualViewport?.height && window.visualViewport.height > 0) {
    return window.visualViewport.height;
  }
  return window.innerHeight;
}

export type FirstAnalysisFrame = {
  top: number;
  left: number;
  right: number;
  height: number;
  viewportHeight: number;
};

export function readFirstAnalysisFrame(): FirstAnalysisFrame {
  const webApp = getTgWebApp();
  const viewportHeight = readViewportHeight(webApp);
  const content = webApp?.contentSafeAreaInset ?? EMPTY_INSET;
  const safe = webApp?.safeAreaInset ?? EMPTY_INSET;

  const top = webApp
    ? Math.max(content.top, safe.top + TG_HEADER_BAR_PX, TG_MIN_CONTENT_TOP_PX)
    : 0;
  const left = content.left || 0;
  const right = content.right || 0;
  const bottom = content.bottom || 0;
  const height = Math.max(viewportHeight - top - bottom, 220);

  return { top, left, right, height, viewportHeight };
}

/** Pixel height for fixed first-analysis panel (updates when TG sheet is dragged). */
export function syncViewportMetrics(): void {
  const frame = readFirstAnalysisFrame();
  const root = document.documentElement;

  root.style.setProperty('--pf-viewport-height', `${frame.viewportHeight}px`);
  root.style.setProperty('--pf-content-height', `${frame.height}px`);
}

let safeAreaListenersBound = false;

function bindSafeAreaListeners(): void {
  if (safeAreaListenersBound) return;
  const webApp = getTgWebApp();
  if (!webApp) return;

  const sync = () => {
    syncTelegramSafeAreaInsets();
    if (!webApp.isExpanded) {
      try {
        webApp.expand();
      } catch {
        /* ignore */
      }
    }
  };

  webApp.onEvent('safeAreaChanged', sync);
  webApp.onEvent('contentSafeAreaChanged', sync);
  webApp.onEvent('viewportChanged', sync);
  safeAreaListenersBound = true;
}

export function setVerticalSwipeLock(locked: boolean): void {
  const webApp = getTgWebApp();
  if (!webApp) return;

  try {
    if (locked) {
      webApp.disableVerticalSwipes?.();
    } else {
      webApp.enableVerticalSwipes?.();
    }
  } catch {
    /* older Telegram clients */
  }
}

export function bindViewportResizeListeners(onChange: () => void): () => void {
  const webApp = getTgWebApp();
  const handler = () => onChange();

  window.addEventListener('resize', handler);
  window.visualViewport?.addEventListener('resize', handler);
  window.visualViewport?.addEventListener('scroll', handler);

  if (webApp) {
    webApp.onEvent('viewportChanged', handler);
    webApp.onEvent('safeAreaChanged', handler);
    webApp.onEvent('contentSafeAreaChanged', handler);
  }

  return () => {
    window.removeEventListener('resize', handler);
    window.visualViewport?.removeEventListener('resize', handler);
    window.visualViewport?.removeEventListener('scroll', handler);
    if (webApp) {
      webApp.offEvent('viewportChanged', handler);
      webApp.offEvent('safeAreaChanged', handler);
      webApp.offEvent('contentSafeAreaChanged', handler);
    }
  };
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
import { useEffect, useRef, type RefObject } from 'react';
import {
  getTgWebApp,
  readFirstAnalysisFrame,
  setVerticalSwipeLock,
  bindViewportResizeListeners,
  syncTelegramSafeAreaInsets,
} from '@/lib/tgWebApp';



function applyViewportStyles(
  el: HTMLElement,
  frame: ReturnType<typeof readFirstAnalysisFrame>,
): void {
  el.style.position = 'fixed';
  el.style.top = `${frame.top}px`;
  el.style.left = `${frame.left}px`;
  el.style.right = `${frame.right}px`;
  el.style.width = 'auto';
  el.style.height = `${frame.height}px`;
  el.style.maxHeight = `${frame.height}px`;
  el.style.overflow = 'hidden';
  el.style.overscrollBehavior = 'none';
  el.style.touchAction = 'none';
  el.style.zIndex = '9999';
}

function lockDocument(frame: ReturnType<typeof readFirstAnalysisFrame>): void {
  const html = document.documentElement;
  const body = document.body;
  const root = document.getElementById('root');
  const h = `${frame.viewportHeight}px`;

  html.classList.add('pf-first-analysis');
  html.style.position = 'fixed';
  html.style.width = '100%';
  html.style.height = h;
  html.style.maxHeight = h;
  html.style.minHeight = '0';
  html.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  html.style.touchAction = 'none';

  body.style.position = 'fixed';
  body.style.width = '100%';
  body.style.height = h;
  body.style.maxHeight = h;
  body.style.minHeight = '0';
  body.style.margin = '0';
  body.style.overflow = 'hidden';
  body.style.overscrollBehavior = 'none';
  body.style.touchAction = 'none';

  if (root) {
    root.style.height = h;
    root.style.maxHeight = h;
    root.style.minHeight = '0';
    root.style.overflow = 'hidden';
    root.style.padding = '0';
    root.style.margin = '0';
  }

  window.scrollTo(0, 0);
}

function clearLockStyles(el: HTMLElement): void {
  el.style.position = '';
  el.style.width = '';
  el.style.height = '';
  el.style.maxHeight = '';
  el.style.minHeight = '';
  el.style.margin = '';
  el.style.padding = '';
  el.style.overflow = '';
  el.style.overscrollBehavior = '';
  el.style.touchAction = '';
}

function unlockDocument(): void {
  const html = document.documentElement;
  const body = document.body;
  const root = document.getElementById('root');

  html.classList.remove('pf-first-analysis');
  clearLockStyles(html);
  clearLockStyles(body);
  if (root) clearLockStyles(root);
  syncTelegramSafeAreaInsets();
}

/** Hard-lock first-analysis UI to Telegram viewport pixels (survives sheet drag). */
export function useFirstAnalysisViewportLock(active: boolean): RefObject<HTMLDivElement | null> {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;

    let alive = true;
    let rafId = 0;

    const sync = () => {
      if (!alive) return;
      const frame = readFirstAnalysisFrame();
      lockDocument(frame);
      if (viewportRef.current) {
        applyViewportStyles(viewportRef.current, frame);
      }
      const webApp = getTgWebApp();
      if (webApp && !webApp.isExpanded) {
        try {
          webApp.expand();
        } catch {
          /* ignore */
        }
      }
    };

    setVerticalSwipeLock(true);
    sync();

    const tick = () => {
      sync();
      if (alive) rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    const unbind = bindViewportResizeListeners(sync);

    const blockScroll = (event: Event) => {
      if (event.cancelable) event.preventDefault();
    };
    document.addEventListener('touchmove', blockScroll, { passive: false });
    document.addEventListener('wheel', blockScroll, { passive: false });
    document.addEventListener('scroll', blockScroll, { passive: false });

    return () => {
      alive = false;
      window.cancelAnimationFrame(rafId);
      unbind();
      document.removeEventListener('touchmove', blockScroll);
      document.removeEventListener('wheel', blockScroll);
      document.removeEventListener('scroll', blockScroll);
      setVerticalSwipeLock(false);
      unlockDocument();
    };
  }, [active]);

  return viewportRef;
}
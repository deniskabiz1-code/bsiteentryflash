/** Disable browser scroll restoration once for the SPA lifetime. */
let scrollRestorationLocked = false;

export function lockScrollRestoration() {
  if (scrollRestorationLocked) return;
  if (typeof window === 'undefined') return;
  if ('scrollRestoration' in window.history) {
    try {
      window.history.scrollRestoration = 'manual';
      scrollRestorationLocked = true;
    } catch {
      /* ignore */
    }
  }
}

/** Force every common scroll root back to the top (window + Telegram WebView quirks). */
export function forceScrollToTop() {
  lockScrollRestoration();

  window.scrollTo(0, 0);
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  } catch {
    /* older clients */
  }

  document.documentElement.scrollTop = 0;
  document.documentElement.scrollLeft = 0;
  document.body.scrollTop = 0;
  document.body.scrollLeft = 0;

  const root = document.getElementById('root');
  if (root) {
    root.scrollTop = 0;
    root.scrollLeft = 0;
  }

  // Some Telegram clients keep scroll on visualViewport offset
  try {
    window.visualViewport?.offsetTop;
  } catch {
    /* ignore */
  }
}

/**
 * Scroll to top now, after paint, and a few short delays —
 * covers async page content that mounts after the first navigation frame.
 */
export function scheduleScrollToTop(): () => void {
  forceScrollToTop();

  let raf1 = 0;
  let raf2 = 0;
  const timers: number[] = [];

  raf1 = requestAnimationFrame(() => {
    forceScrollToTop();
    raf2 = requestAnimationFrame(() => {
      forceScrollToTop();
    });
  });

  for (const ms of [0, 16, 50, 100, 200, 400]) {
    timers.push(window.setTimeout(forceScrollToTop, ms));
  }

  return () => {
    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
    timers.forEach((id) => window.clearTimeout(id));
  };
}

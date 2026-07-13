import { useEffect, useState, type RefObject } from 'react';
import { acquirePageFitLock } from '@/lib/pageScrollLock';
import { setVerticalSwipeLock } from '@/lib/tgWebApp';

const BOTTOM_NAV_PX = 92;

function isInteractiveTouchTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element
    && Boolean(target.closest('input, textarea, select, button, label, [data-touch-interactive]'))
  );
}

function readViewportBottom(): number {
  const vv = window.visualViewport;
  if (!vv) return window.innerHeight;
  return vv.offsetTop + vv.height;
}

/** Block page scroll only when content fits; never change page layout/CSS. */
export function useConditionalPageScrollLock(
  contentRef: RefObject<HTMLElement | null>,
  ready: boolean,
  remeasureKey: string | number,
) {
  const [allowScroll, setAllowScroll] = useState(true);

  useEffect(() => {
    if (!ready) {
      setAllowScroll(true);
      return;
    }

    const measure = () => {
      const content = contentRef.current;
      if (!content) return;

      const available = readViewportBottom() - BOTTOM_NAV_PX;
      const bottom = content.getBoundingClientRect().bottom;
      setAllowScroll(bottom > available + 8);
    };

    const scheduleMeasure = () => {
      requestAnimationFrame(() => {
        measure();
        requestAnimationFrame(measure);
      });
    };

    scheduleMeasure();
    const observer = new ResizeObserver(scheduleMeasure);
    const content = contentRef.current;
    if (content) {
      observer.observe(content);
      const page = content.parentElement;
      if (page) observer.observe(page);
    }
    window.addEventListener('resize', scheduleMeasure);
    window.visualViewport?.addEventListener('resize', scheduleMeasure);
    window.visualViewport?.addEventListener('scroll', scheduleMeasure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.visualViewport?.removeEventListener('resize', scheduleMeasure);
      window.visualViewport?.removeEventListener('scroll', scheduleMeasure);
    };
  }, [ready, remeasureKey, contentRef]);

  useEffect(() => {
    if (!ready || allowScroll) return;

    window.scrollTo(0, 0);
    setVerticalSwipeLock(true);
    const releaseLock = acquirePageFitLock();

    const blockScroll = (event: Event) => {
      if (event.type === 'touchmove' && isInteractiveTouchTarget(event.target)) return;
      if (event.cancelable) event.preventDefault();
    };

    const resetScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    document.addEventListener('touchmove', blockScroll, { passive: false });
    document.addEventListener('wheel', blockScroll, { passive: false });
    document.addEventListener('scroll', resetScroll, { passive: true });

    return () => {
      releaseLock();
      setVerticalSwipeLock(false);
      document.removeEventListener('touchmove', blockScroll);
      document.removeEventListener('wheel', blockScroll);
      document.removeEventListener('scroll', resetScroll);
    };
  }, [ready, allowScroll]);

  return allowScroll;
}
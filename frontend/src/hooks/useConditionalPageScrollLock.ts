import { useEffect, useState, type RefObject } from 'react';
import { setVerticalSwipeLock } from '@/lib/tgWebApp';

const BOTTOM_NAV_PX = 92;

function isInteractiveTouchTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element
    && Boolean(target.closest('input, textarea, select, button, label, [data-touch-interactive]'))
  );
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
      const root = document.getElementById('root');
      if (!content || !root) return;

      const padTop = parseFloat(getComputedStyle(root).paddingTop) || 0;
      const available = window.innerHeight - padTop - BOTTOM_NAV_PX;
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
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener('resize', scheduleMeasure);
    window.visualViewport?.addEventListener('resize', scheduleMeasure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.visualViewport?.removeEventListener('resize', scheduleMeasure);
    };
  }, [ready, remeasureKey, contentRef]);

  useEffect(() => {
    if (!ready || allowScroll) return;

    setVerticalSwipeLock(true);

    const blockScroll = (event: Event) => {
      if (isInteractiveTouchTarget(event.target)) return;
      if (event.cancelable) event.preventDefault();
    };
    document.addEventListener('touchmove', blockScroll, { passive: false });

    return () => {
      setVerticalSwipeLock(false);
      document.removeEventListener('touchmove', blockScroll);
    };
  }, [ready, allowScroll]);

  return allowScroll;
}
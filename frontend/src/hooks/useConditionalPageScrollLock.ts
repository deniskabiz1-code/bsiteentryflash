import { useEffect, useRef, useState, type RefObject } from 'react';
import { acquirePageFitLock } from '@/lib/pageScrollLock';
import { setVerticalSwipeLock } from '@/lib/tgWebApp';

const BOTTOM_NAV_PX = 92;
/** Prevent lock/unlock flicker when height is near the threshold. */
const HYSTERESIS_PX = 24;

function isInteractiveTouchTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element
    && Boolean(target.closest('input, textarea, select, button, label, a, [data-touch-interactive]'))
  );
}

function readViewportBottom(): number {
  const vv = window.visualViewport;
  if (!vv) return window.innerHeight;
  return vv.offsetTop + vv.height;
}

/** Content bottom in document coordinates — stable while the user scrolls. */
function readContentDocumentBottom(content: HTMLElement): number {
  const rect = content.getBoundingClientRect();
  return rect.top + window.scrollY + content.offsetHeight;
}

/** Block page scroll only when content fits; never change page layout/CSS. */
export function useConditionalPageScrollLock(
  contentRef: RefObject<HTMLElement | null>,
  ready: boolean,
  remeasureKey: string | number,
) {
  const [allowScroll, setAllowScroll] = useState(true);
  const allowScrollRef = useRef(true);
  const hadOverflowRef = useRef(false);

  useEffect(() => {
    allowScrollRef.current = allowScroll;
  }, [allowScroll]);

  useEffect(() => {
    hadOverflowRef.current = false;
  }, [remeasureKey]);

  useEffect(() => {
    if (!ready) {
      setAllowScroll(true);
      return;
    }

    const measure = () => {
      const content = contentRef.current;
      if (!content) return;

      const available = readViewportBottom() - BOTTOM_NAV_PX;
      const documentBottom = readContentDocumentBottom(content);
      const overflows = documentBottom > available + 8;
      const prev = allowScrollRef.current;

      if (overflows) {
        hadOverflowRef.current = true;
        setAllowScroll(true);
        return;
      }

      // Phone/Telegram: viewport can shrink while touch-scrolling — never re-lock once overflow was seen.
      if (hadOverflowRef.current) {
        setAllowScroll(true);
        return;
      }

      if (prev || documentBottom < available - HYSTERESIS_PX) {
        setAllowScroll(false);
      }
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

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.visualViewport?.removeEventListener('resize', scheduleMeasure);
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

    document.addEventListener('touchmove', blockScroll, { passive: false });
    document.addEventListener('wheel', blockScroll, { passive: false });

    return () => {
      releaseLock();
      setVerticalSwipeLock(false);
      document.removeEventListener('touchmove', blockScroll);
      document.removeEventListener('wheel', blockScroll);
    };
  }, [ready, allowScroll]);

  return allowScroll;
}
import { useEffect, useState, type RefObject } from 'react';
import { setVerticalSwipeLock } from '@/lib/tgWebApp';

const BOTTOM_NAV_PX = 92;
const HTML_CLASS = 'pf-progress-lock';

function isInteractiveTouchTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element
    && Boolean(target.closest('input, textarea, select, button, label, [data-touch-interactive]'))
  );
}

/** Lock page scroll until content exceeds the viewport; then allow normal scrolling. */
export function useConditionalPageScrollLock(
  contentRef: RefObject<HTMLElement | null>,
  ready: boolean,
  remeasureKey: string | number,
  htmlClass = HTML_CLASS,
) {
  const [allowScroll, setAllowScroll] = useState(false);

  useEffect(() => {
    if (!ready) {
      setAllowScroll(false);
      return;
    }

    const measure = () => {
      const content = contentRef.current;
      const root = document.getElementById('root');
      if (!content || !root) return;

      const padTop = parseFloat(getComputedStyle(root).paddingTop) || 0;
      const available = window.innerHeight - padTop - BOTTOM_NAV_PX;
      const top = content.getBoundingClientRect().top;
      const needed = top + content.offsetHeight;
      setAllowScroll(needed > available + 8);
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

    document.documentElement.classList.add(htmlClass);
    setVerticalSwipeLock(true);

    const blockScroll = (event: Event) => {
      if (isInteractiveTouchTarget(event.target)) return;
      if (event.cancelable) event.preventDefault();
    };
    document.addEventListener('touchmove', blockScroll, { passive: false });
    document.addEventListener('wheel', blockScroll, { passive: false });

    return () => {
      document.documentElement.classList.remove(htmlClass);
      setVerticalSwipeLock(false);
      document.removeEventListener('touchmove', blockScroll);
      document.removeEventListener('wheel', blockScroll);
    };
  }, [ready, allowScroll, htmlClass]);

  return allowScroll;
}
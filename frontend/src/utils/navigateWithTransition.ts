import { flushSync } from 'react-dom';
import type { NavigateFunction, NavigateOptions, To } from 'react-router-dom';

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/** Prefer native View Transitions when available; falls back to plain navigate. */
export function navigateWithTransition(
  navigate: NavigateFunction,
  to: To,
  options?: NavigateOptions,
) {
  const doc = document as DocumentWithViewTransition;
  if (typeof doc.startViewTransition !== 'function') {
    navigate(to, options);
    return;
  }

  try {
    doc.startViewTransition(() => {
      flushSync(() => {
        navigate(to, options);
      });
    });
  } catch {
    navigate(to, options);
  }
}

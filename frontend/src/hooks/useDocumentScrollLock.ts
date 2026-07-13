import { useEffect } from 'react';
import { acquirePageFitLock } from '@/lib/pageScrollLock';

/** Lock document scroll (e.g. during loading spinners) so layout width stays stable. */
export function useDocumentScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    window.scrollTo(0, 0);
    return acquirePageFitLock();
  }, [locked]);
}
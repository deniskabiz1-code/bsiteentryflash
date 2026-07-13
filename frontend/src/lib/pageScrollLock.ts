export const PAGE_FIT_LOCK_CLASS = 'pf-page-fit-lock';

let lockCount = 0;

export function acquirePageFitLock(): () => void {
  if (lockCount === 0) {
    document.documentElement.classList.add(PAGE_FIT_LOCK_CLASS);
  }
  lockCount += 1;

  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.documentElement.classList.remove(PAGE_FIT_LOCK_CLASS);
    }
  };
}
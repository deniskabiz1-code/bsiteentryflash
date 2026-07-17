import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { lockScrollRestoration, scheduleScrollToTop } from '@/utils/scroll';

export default function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();

  useLayoutEffect(() => {
    lockScrollRestoration();
  }, []);

  useLayoutEffect(() => {
    return scheduleScrollToTop();
  }, [pathname, search, hash, key]);

  return null;
}

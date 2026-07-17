import { useLayoutEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { resolvePageTransition } from '@/utils/routeTransition';
import { forceScrollToTop } from '@/utils/scroll';

type PageTransitionProps = {
  children: ReactNode;
};

/** Survives remounts when parent sets key={pathname}. */
let lastPathname = '';

/**
 * Parent should pass key={location.pathname} so this shell remounts every navigation
 * and CSS enter animations always restart.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const from = lastPathname;
  const kind =
    from && from !== location.pathname
      ? resolvePageTransition(from, location.pathname)
      : 'fade';
  lastPathname = location.pathname;

  useLayoutEffect(() => {
    forceScrollToTop();
  }, [location.pathname]);

  return (
    <div className={`page-transition page-transition--${kind}`}>
      {children}
    </div>
  );
}

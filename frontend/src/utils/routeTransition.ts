export type PageTransitionKind = 'tab-left' | 'tab-right' | 'push' | 'pop' | 'fade';

type RouteMeta = {
  tab: number;
  depth: number;
};

function routeMeta(pathname: string): RouteMeta {
  if (pathname.startsWith('/analysis/result') || pathname.startsWith('/analysis/hairstyle')) {
    return { tab: 1, depth: 1 };
  }
  if (pathname === '/free-analysis') {
    return { tab: 3, depth: 1 };
  }
  if (pathname.startsWith('/analysis')) {
    return { tab: 1, depth: 0 };
  }
  if (pathname.startsWith('/progress')) {
    return { tab: 2, depth: 0 };
  }
  if (pathname.startsWith('/profile')) {
    return { tab: 3, depth: 0 };
  }
  if (pathname === '/') {
    return { tab: 0, depth: 0 };
  }
  return { tab: 0, depth: 0 };
}

export function resolvePageTransition(
  fromPath: string,
  toPath: string,
): PageTransitionKind {
  if (fromPath === toPath) return 'fade';

  const from = routeMeta(fromPath);
  const to = routeMeta(toPath);

  if (to.depth > from.depth) return 'push';
  if (to.depth < from.depth) return 'pop';

  if (to.tab !== from.tab) {
    return to.tab > from.tab ? 'tab-right' : 'tab-left';
  }

  return 'fade';
}

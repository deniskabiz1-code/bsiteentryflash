import { useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useConditionalPageScrollLock } from '@/hooks/useConditionalPageScrollLock';

type ConditionalScrollPageProps = {
  children: ReactNode;
  ready?: boolean;
  remeasureKey?: string | number;
  className?: string;
  innerClassName?: string;
};

export default function ConditionalScrollPage({
  children,
  ready = true,
  remeasureKey = 0,
  className = 'page',
  innerClassName = 'page-inner space-y-6 page-animate',
}: ConditionalScrollPageProps) {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  useConditionalPageScrollLock(contentRef, ready, remeasureKey);

  return (
    <div className={className}>
      <div
        key={`${location.pathname}-${ready ? 'ready' : 'wait'}`}
        ref={contentRef}
        className={innerClassName}
      >
        {children}
      </div>
    </div>
  );
}

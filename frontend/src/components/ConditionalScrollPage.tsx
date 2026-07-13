import { useRef, type ReactNode } from 'react';
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
  innerClassName = 'page-inner space-y-6',
}: ConditionalScrollPageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  useConditionalPageScrollLock(contentRef, ready, remeasureKey);

  return (
    <div className={className}>
      <div ref={contentRef} className={innerClassName}>
        {children}
      </div>
    </div>
  );
}
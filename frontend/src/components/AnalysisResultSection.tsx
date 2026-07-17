import { ReactNode } from 'react';

type AnalysisResultSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function AnalysisResultSection({
  title,
  children,
  className = '',
}: AnalysisResultSectionProps) {
  return (
    <section className={`anim-fade-in ${className}`.trim()}>
      <h2 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wide text-app-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
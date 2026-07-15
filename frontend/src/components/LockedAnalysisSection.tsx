import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

type LockedAnalysisSectionProps = {
  title: string;
  description: string;
  teaser?: ReactNode;
  lockedLabels?: string[];
  lockedCount?: number;
  onSubscribe?: () => void;
  subscribeLabel?: string;
};

export default function LockedAnalysisSection({
  title,
  description,
  teaser,
  lockedLabels = [],
  lockedCount = 3,
  onSubscribe,
  subscribeLabel = 'Оформить подписку — 400 ₽/мес',
}: LockedAnalysisSectionProps) {
  const placeholders = lockedLabels.length > 0
    ? lockedLabels
    : ['Персональный разбор', 'Пошаговые рекомендации', 'План на 4 недели'];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[17px] font-bold">{title}</h2>
        <span className="pill-gray inline-flex items-center gap-1 font-semibold text-app-text">
          <Lock size={12} className="text-app-text" strokeWidth={2.5} />
          По подписке
        </span>
      </div>
      <div className="card space-y-4">
        <p className="text-[14px] leading-relaxed text-app-muted">{description}</p>
        {teaser}
        <div className="space-y-2">
          {placeholders.slice(0, 3).map((label) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-canvas/40 px-4 py-3"
            >
              <p className="min-w-0 flex-1 text-[14px] font-medium text-app-muted/80 blur-[3px] select-none">
                {label}
              </p>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-app-track px-2 py-1 text-[10px] font-semibold text-app-muted">
                <Lock size={10} />
                Подписка
              </span>
            </div>
          ))}
        </div>
        {lockedCount > 0 && (
          <p className="text-[13px] font-medium text-app-text">
            + ещё {lockedCount} {lockedCount === 1 ? 'блок' : lockedCount < 5 ? 'блока' : 'блоков'} в полном разборе
          </p>
        )}
        {onSubscribe && (
          <button type="button" onClick={onSubscribe} className="btn-dark">
            {subscribeLabel}
          </button>
        )}
      </div>
    </section>
  );
}
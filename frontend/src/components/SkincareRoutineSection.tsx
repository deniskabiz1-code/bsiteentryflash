import { Lock } from 'lucide-react';
import WildberriesProductCard from '@/components/WildberriesProductCard';
import type {
  EnrichedSkincareStep,
  SkincareAnalysisContext,
  SkincareRoutineStep,
} from '@/data/wildberriesSkincare';
import {
  enrichSkincareRoutine,
  normalizeSkincareRoutine,
  selectPersonalizedSkincare,
} from '@/data/wildberriesSkincare';

type SkincareRoutineSectionProps = {
  title?: string;
  routine?: SkincareRoutineStep[] | EnrichedSkincareStep[];
  skinContext?: SkincareAnalysisContext;
  subscribed: boolean;
  onSubscribe?: () => void;
  emptyMessage?: string;
  /** Tighter teaser for Home; full layout elsewhere (e.g. analysis result). */
  compact?: boolean;
};

function isEnriched(step: SkincareRoutineStep | EnrichedSkincareStep): step is EnrichedSkincareStep {
  return 'product' in step;
}

export default function SkincareRoutineSection({
  title = 'Уход за кожей',
  routine = [],
  skinContext,
  subscribed,
  onSubscribe,
  emptyMessage = 'Сделайте анализ лица. Персональная рутина появится здесь',
  compact = false,
}: SkincareRoutineSectionProps) {
  const personalized = selectPersonalizedSkincare(skinContext ?? {}, 5);
  const head = personalized[0];
  const restLocked = personalized.slice(1, compact ? 2 : 4);

  const enrichedRoutine = subscribed
    ? (routine.length > 0 && isEnriched(routine[0])
        ? (routine as EnrichedSkincareStep[])
        : enrichSkincareRoutine(normalizeSkincareRoutine(routine, skinContext)))
        .filter((item) => item.product)
        .slice(0, 5)
    : [];

  if (subscribed && enrichedRoutine.length > 0) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <span className="pill-green">Под вашу кожу</span>
        </div>
        <p className="mb-3 px-1 text-[13px] leading-snug text-app-muted">
          Несколько средств, которые лучше всего подходят по анализу: когда и как наносить, ссылки на WB и Ozon.
        </p>
        <div className="card !p-0 overflow-hidden">
          {enrichedRoutine.map((item, i) => {
            const pick = personalized.find((p) => p.product?.id === item.product?.id);
            return (
              <div key={item.product?.id ?? i} className="border-b border-app-border last:border-0">
                <WildberriesProductCard
                  product={item.product!}
                  whenLabel={pick?.whenLabel}
                  howToUse={pick?.howToUse || item.tip}
                  whyFits={item.product_type || pick?.whyFits}
                  stepLabel={item.step}
                />
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (subscribed && enrichedRoutine.length === 0) {
    return (
      <section className="card text-center py-8">
        <h2 className="text-[17px] font-bold">{title}</h2>
        <p className="mt-2 text-[14px] text-app-muted">{emptyMessage}</p>
      </section>
    );
  }

  if (compact) {
    return (
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <span className="pill-gray inline-flex items-center gap-1 font-semibold text-app-text">
            <Lock size={12} className="text-app-text" strokeWidth={2.5} />
            По подписке
          </span>
        </div>
        <div className="card space-y-3 !py-4">
          <p className="text-[13px] leading-snug text-app-muted">
            Средства под ваш тип кожи: когда наносить и как. После анализа и подписки.
          </p>
          <div className="overflow-hidden rounded-2xl border border-app-border">
            {head?.product && (
              <WildberriesProductCard
                product={head.product}
                previewOnly
                compact
                whenLabel={head.whenLabel}
                howToUse={head.howToUse}
                stepLabel={head.step}
              />
            )}
            {restLocked.map((pick) => (
              <div
                key={pick.product!.id}
                className="flex items-center justify-between gap-3 border-t border-app-border bg-app-canvas/40 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-brand-greenDark">{pick.whenLabel}</p>
                  <p className="mt-0.5 truncate text-[13px] font-medium text-app-muted/80 blur-[2.5px] select-none">
                    {pick.product!.name}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-app-track px-2 py-1 text-[10px] font-semibold text-app-muted">
                  <Lock size={10} />
                  Скрыто
                </span>
              </div>
            ))}
          </div>
          {onSubscribe && (
            <button type="button" onClick={onSubscribe} className="btn-dark !py-3.5 text-[14px]">
              400 ₽/мес
            </button>
          )}
        </div>
      </section>
    );
  }

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
        <p className="text-[14px] leading-relaxed text-app-muted">
          Подборка под ваш анализ: несколько подходящих средств, когда и как их использовать, со ссылками на WB и Ozon.
        </p>
        <div className="overflow-hidden rounded-2xl border border-app-border">
          {head?.product && (
            <WildberriesProductCard
              product={head.product}
              previewOnly
              whenLabel={head.whenLabel}
              howToUse={head.howToUse}
              whyFits={head.whyFits}
              stepLabel={head.step}
            />
          )}
          {restLocked.map((pick) => (
            <div
              key={pick.product!.id}
              className="flex items-center justify-between gap-3 border-t border-app-border bg-app-canvas/40 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-brand-greenDark">
                  {pick.whenLabel}
                  {pick.step ? ` · ${pick.step}` : ''}
                </p>
                <p className="mt-0.5 truncate text-[14px] font-medium text-app-muted/80 blur-[2.5px] select-none">
                  {pick.product!.name}
                </p>
                <p className="mt-0.5 text-[11px] text-app-faint blur-[2px] select-none">
                  {pick.howToUse}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-app-track px-2 py-1 text-[10px] font-semibold text-app-muted">
                <Lock size={10} />
                Скрыто
              </span>
            </div>
          ))}
        </div>
        <p className="text-[12px] leading-snug text-app-faint">
          После подписки: полные названия, артикулы и прямые ссылки на товары.
        </p>
        {onSubscribe && (
          <button type="button" onClick={onSubscribe} className="btn-dark">
            400 ₽/мес
          </button>
        )}
      </div>
    </section>
  );
}

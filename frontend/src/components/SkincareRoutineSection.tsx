import { Lock } from 'lucide-react';
import WildberriesProductCard from '@/components/WildberriesProductCard';
import type { EnrichedSkincareStep, SkincareRoutineStep } from '@/data/wildberriesSkincare';
import {
  enrichSkincareRoutine,
  getSkincarePreviewProducts,
  SKINCARE_PRODUCT_CATALOG,
} from '@/data/wildberriesSkincare';

const LOCKED_PLACEHOLDERS = [
  'Пенка для умывания',
  'Сыворотка с азелаиновой кислотой',
  'Крем от прыщей',
  'Сыворотка витамин C',
];

type SkincareRoutineSectionProps = {
  title?: string;
  routine?: SkincareRoutineStep[] | EnrichedSkincareStep[];
  subscribed: boolean;
  onSubscribe?: () => void;
  emptyMessage?: string;
};

function isEnriched(step: SkincareRoutineStep | EnrichedSkincareStep): step is EnrichedSkincareStep {
  return 'product' in step;
}

export default function SkincareRoutineSection({
  title = 'Уход за кожей',
  routine = [],
  subscribed,
  onSubscribe,
  emptyMessage = 'Сделайте анализ лица — персональная рутина появится здесь',
}: SkincareRoutineSectionProps) {
  const teaserProduct = getSkincarePreviewProducts(1)[0];
  const lockedCount = Math.max(SKINCARE_PRODUCT_CATALOG.length - 1, 1);
  const enrichedRoutine = subscribed
    ? (routine.length > 0 && isEnriched(routine[0])
        ? (routine as EnrichedSkincareStep[])
        : enrichSkincareRoutine(routine))
    : [];

  if (subscribed && enrichedRoutine.length > 0) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <span className="pill-green">Подписка</span>
        </div>
        <p className="mb-3 px-1 text-[13px] leading-snug text-app-muted">
          Персональная рутина с товарами WB и Ozon — нажмите, чтобы открыть карточку.
        </p>
        <div className="card !p-0 overflow-hidden">
          {enrichedRoutine.map((item, i) => (
            <div key={i} className="border-b border-app-border last:border-0">
              <div className="px-5 py-4">
                <p className="font-semibold text-[15px]">{item.step}</p>
                <p className="mt-1 text-[14px] text-app-muted">{item.product_type}</p>
                <p className="mt-1 text-[13px] text-app-faint">{item.tip}</p>
              </div>
              {item.product && (
                <div className="border-t border-app-border bg-app-canvas/60">
                  <WildberriesProductCard product={item.product} />
                </div>
              )}
            </div>
          ))}
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
          Пример из подборки WB и Ozon. Полная рутина с артикулами и ссылками — только по подписке.
        </p>
        <div className="rounded-2xl border border-app-border overflow-hidden">
          <p className="bg-app-track/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
            Пример · 1 из {SKINCARE_PRODUCT_CATALOG.length}
          </p>
          {teaserProduct && (
            <WildberriesProductCard product={teaserProduct} previewOnly />
          )}
          {LOCKED_PLACEHOLDERS.slice(0, Math.min(lockedCount, 3)).map((label) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 border-t border-app-border bg-app-canvas/40 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-app-muted/80 blur-[3px] select-none">
                  {label}
                </p>
                <p className="mt-1 text-[11px] text-app-faint">Артикул · •••••••</p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-app-track px-2 py-1 text-[10px] font-semibold text-app-muted">
                <Lock size={10} />
                Подписка
              </span>
            </div>
          ))}
        </div>
        <p className="text-[13px] font-medium text-app-text">
          + ещё {lockedCount} {lockedCount === 1 ? 'товар' : lockedCount < 5 ? 'товара' : 'товаров'} в полной рутине
        </p>
        <p className="text-[12px] leading-snug text-app-faint">
          После подписки и анализа — персональные шаги утро/вечер и ссылки на все товары.
        </p>
        {onSubscribe && (
          <button type="button" onClick={onSubscribe} className="btn-dark">
            Оформить подписку — 400 ₽/мес
          </button>
        )}
      </div>
    </section>
  );
}
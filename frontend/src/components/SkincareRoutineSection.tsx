import { Lock } from 'lucide-react';
import WildberriesProductCard from '@/components/WildberriesProductCard';
import type { EnrichedSkincareStep, SkincareRoutineStep, WildberriesProduct } from '@/data/wildberriesSkincare';
import { enrichSkincareRoutine, getSkincarePreviewProducts } from '@/data/wildberriesSkincare';

type SkincareRoutineSectionProps = {
  title?: string;
  routine?: SkincareRoutineStep[] | EnrichedSkincareStep[];
  subscribed: boolean;
  previewProducts?: WildberriesProduct[];
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
  previewProducts,
  onSubscribe,
  emptyMessage = 'Сделайте анализ лица — персональная рутина появится здесь',
}: SkincareRoutineSectionProps) {
  const preview = previewProducts ?? getSkincarePreviewProducts(4);
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
          Персональная рутина с товарами Wildberries — нажмите, чтобы открыть карточку.
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
        <span className="pill-gray inline-flex items-center gap-1">
          <Lock size={12} />
          По подписке
        </span>
      </div>
      <div className="card space-y-4">
        <p className="text-[14px] leading-relaxed text-app-muted">
          В подписку входит персональная рутина ухода и подборка товаров с Wildberries под ваш тип кожи.
        </p>
        <div className="rounded-2xl border border-app-border overflow-hidden">
          <p className="bg-app-track/60 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-app-muted">
            Примеры из подборки
          </p>
          {preview.map((product, i) => (
            <div key={product.id} className={i > 0 ? 'border-t border-app-border' : ''}>
              <WildberriesProductCard product={product} compact />
            </div>
          ))}
        </div>
        <p className="text-[12px] leading-snug text-app-faint">
          + ещё {Math.max(0, 5 - preview.length)} товара в полной рутине после анализа
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
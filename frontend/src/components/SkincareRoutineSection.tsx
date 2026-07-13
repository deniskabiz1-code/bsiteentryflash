import { Lock } from 'lucide-react';
import WildberriesProductCard from '@/components/WildberriesProductCard';
import type { EnrichedSkincareStep, SkincareRoutineStep } from '@/data/wildberriesSkincare';
import { enrichSkincareRoutine } from '@/data/wildberriesSkincare';

const LOCKED_STEPS = [
  'Утро и вечер — пошаговая рутина',
  'Товары Wildberries под ваш тип кожи',
  'Артикулы и ссылки после анализа',
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
          Персональная рутина и подборка с Wildberries — только по подписке, после анализа лица.
        </p>
        <ul className="space-y-2 rounded-2xl bg-app-track/50 px-4 py-3">
          {LOCKED_STEPS.map((line) => (
            <li key={line} className="text-[13px] text-app-muted">· {line}</li>
          ))}
        </ul>
        {onSubscribe && (
          <button type="button" onClick={onSubscribe} className="btn-dark">
            Оформить подписку — 400 ₽/мес
          </button>
        )}
      </div>
    </section>
  );
}
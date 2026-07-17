import { Check, Crown, Lock, Sparkles, X } from 'lucide-react';
import WildberriesProductCard from '@/components/WildberriesProductCard';
import { selectPersonalizedSkincare } from '@/data/wildberriesSkincare';
import { SCORE_LABELS, SKIN_TYPE_LABELS } from '@/types';

type AnalysisPaywallBannerProps = {
  onSubscribe: () => void;
  overallScore?: number;
  scores?: Record<string, number>;
  skinType?: string;
  puffiness?: string;
  problemZones?: { zone: string; description?: string }[];
};

const FULL_BLOCKS = [
  'Сильные стороны и зоны внимания',
  'Быстрые улучшения и советы',
  'Стрижки и план на 4 недели',
  'Персональная рутина ухода',
];

function getFocusArea(scores: Record<string, number>): string {
  let focusKey = 'skin';
  let lowest = 101;
  for (const [key, value] of Object.entries(scores)) {
    if (typeof value === 'number' && value < lowest) {
      lowest = value;
      focusKey = key;
    }
  }
  return SCORE_LABELS[focusKey] || 'внешности';
}

export default function AnalysisPaywallBanner({
  onSubscribe,
  overallScore,
  scores = {},
  skinType,
  puffiness,
  problemZones,
}: AnalysisPaywallBannerProps) {
  const focusArea = getFocusArea(scores);
  const skinLabel = skinType ? SKIN_TYPE_LABELS[skinType] : null;
  const picks = selectPersonalizedSkincare(
    {
      skin_type: skinType,
      puffiness,
      problem_zones: problemZones,
      scores: scores as { skin?: number },
    },
    5,
  );
  const head = picks[0];
  const rest = picks.slice(1);
  const blurredInsights = [
    `Персональный план: что улучшить в зоне «${focusArea}»`,
    '3 стрижки под вашу форму лица с объяснением',
    'Динамика к следующему анализу и метрики прогресса',
  ];

  return (
    <section className="space-y-4">
      <div className="card overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-app-text to-[#2a2a2e] px-5 py-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Crown size={22} className="text-brand-green" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">
                {typeof overallScore === 'number' ? `Ваш балл ${overallScore}/100` : 'Базовый анализ готов'}
              </p>
              <h2 className="text-[20px] font-bold leading-tight">
                Откройте полный ИИ-разбор
              </h2>
              <p className="text-[13px] leading-snug text-white/75">
                {skinLabel
                  ? `Подписка соберёт план под ${skinLabel.toLowerCase()} кожу и ваши оценки. Не общие советы из интернета.`
                  : 'Подписка открывает персональный план, стрижки и уход под ваше фото.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-app-border">
          <div className="bg-app-surface px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-app-muted">Сейчас</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-app-muted">
              <li className="flex items-center gap-1.5"><Check size={13} className="text-brand-greenDark" /> Оценки</li>
              <li className="flex items-center gap-1.5"><Check size={13} className="text-brand-greenDark" /> Краткий обзор</li>
              <li className="flex items-center gap-1.5"><X size={13} className="text-app-faint" /> Полный разбор</li>
            </ul>
          </div>
          <div className="bg-brand-green/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-greenDark">Подписка</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-app-text">
              <li className="flex items-center gap-1.5"><Check size={13} className="text-brand-greenDark" /> Безлимит анализов</li>
              <li className="flex items-center gap-1.5"><Check size={13} className="text-brand-greenDark" /> Все блоки ниже</li>
              <li className="flex items-center gap-1.5"><Check size={13} className="text-brand-greenDark" /> Причёска + уход</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <button type="button" onClick={onSubscribe} className="btn-dark w-full">
            400 ₽/мес
          </button>
          <p className="text-center text-[11px] text-app-muted">
            Доступ сразу после оплаты · отмена в любой момент
          </p>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold">Пример полного разбора</h3>
          <span className="pill-gray inline-flex items-center gap-1 text-[10px] font-semibold">
            <Lock size={10} />
            Скрыто
          </span>
        </div>
        <p className="text-[13px] leading-snug text-app-muted">
          Фокус по вашему фото: <span className="font-semibold text-app-text">{focusArea}</span>
        </p>
        <div className="space-y-2 rounded-2xl border border-app-border bg-app-canvas/40 p-3">
          {blurredInsights.map((line, i) => (
            <div
              key={line}
              className={`flex items-start gap-2 text-[13px] leading-snug ${i > 0 ? 'blur-[3px] select-none text-app-muted/80' : 'text-app-text'}`}
            >
              <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-greenDark" />
              <span>{line}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FULL_BLOCKS.map((block) => (
            <span
              key={block}
              className="rounded-full bg-app-track px-2.5 py-1 text-[11px] font-medium text-app-muted"
            >
              {block}
            </span>
          ))}
        </div>
      </div>

      {head?.product && (
        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-app-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold">Уход под ваш анализ</p>
              <p className="mt-0.5 text-[12px] text-app-muted">
                {skinLabel
                  ? `Подобрано под ${skinLabel.toLowerCase()} кожу и зоны внимания`
                  : 'Средства под ваши оценки и тип кожи'}
              </p>
            </div>
            <span className="pill-gray inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold">
              <Lock size={10} />
              По подписке
            </span>
          </div>
          <WildberriesProductCard
            product={head.product}
            previewOnly
            whenLabel={head.whenLabel}
            howToUse={head.howToUse}
            whyFits={head.whyFits}
            stepLabel={head.step}
          />
          {rest.map((pick) => (
            <div
              key={pick.product!.id}
              className="flex items-center justify-between gap-3 border-t border-app-border bg-app-canvas/40 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-brand-greenDark">
                  {pick.whenLabel}
                  {pick.step ? ` · ${pick.step}` : ''}
                </p>
                <p className="mt-0.5 truncate text-[13px] font-medium text-app-muted/80 blur-[2.5px] select-none">
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
          <div className="px-4 pb-4 pt-3">
            <button type="button" onClick={onSubscribe} className="btn-accent w-full">
              Открыть полный уход и разбор
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

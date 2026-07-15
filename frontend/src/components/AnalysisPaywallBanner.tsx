import { Crown, Lock, Sparkles } from 'lucide-react';

type AnalysisPaywallBannerProps = {
  onSubscribe: () => void;
};

const LOCKED_FEATURES = [
  'Сильные стороны и зоны внимания',
  'Быстрые улучшения и персональные советы',
  'Подбор стрижек и план развития',
  'Рутина ухода с товарами WB/Ozon',
];

export default function AnalysisPaywallBanner({
  onSubscribe,
}: AnalysisPaywallBannerProps) {
  return (
    <section className="card overflow-hidden !p-0">
      <div className="bg-gradient-to-br from-app-text to-[#2a2a2e] px-5 py-5 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Crown size={22} className="text-brand-green" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">
              Базовый анализ готов
            </p>
            <h2 className="text-[20px] font-bold leading-tight">
              Разблокируйте полный разбор
            </h2>
            <p className="text-[13px] leading-snug text-white/75">
              Вы видите оценки и краткий обзор. Подписка открывает детальный план, стрижки и уход.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <ul className="space-y-2">
          {LOCKED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-snug">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-brand-greenDark" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-dashed border-app-border bg-app-track/40 px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-app-text">
            <Lock size={14} />
            8+ персональных блоков скрыто
          </p>
          <p className="mt-1 text-[12px] leading-snug text-app-muted">
            Подписка — безлимит полных анализов, причёска и рутина ухода.
          </p>
        </div>

        <button type="button" onClick={onSubscribe} className="btn-dark w-full">
          Оформить подписку — 400 ₽/мес
        </button>
      </div>
    </section>
  );
}
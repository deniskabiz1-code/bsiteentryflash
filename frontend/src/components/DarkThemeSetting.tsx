import { Lock, Moon, Sparkles } from 'lucide-react';

type DarkThemeSettingProps = {
  enabled: boolean;
  subscribed: boolean;
  onToggle: () => void;
  onSubscribe: () => void;
};

function DarkThemePreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-app-border">
      <div className="grid grid-cols-2">
        <div className="bg-[#F5F5F7] p-3">
          <div className="mb-2 h-2 w-10 rounded-full bg-[#E5E5EA]" />
          <div className="space-y-1.5">
            <div className="h-8 rounded-lg bg-white shadow-sm" />
            <div className="h-5 rounded-lg bg-white/80" />
          </div>
          <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-[#8E8E93]">Светлая</p>
        </div>
        <div className="relative bg-[#000000] p-3">
          <div className="mb-2 h-2 w-10 rounded-full bg-[#38383A]" />
          <div className="space-y-1.5">
            <div className="h-8 rounded-lg bg-[#1C1C1E] shadow-sm" />
            <div className="h-5 rounded-lg bg-[#2C2C2E]" />
          </div>
          <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-[#30D158]">Тёмная</p>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white ring-1 ring-white/20">
              <Lock size={10} />
              PRO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DarkThemeSetting({
  enabled,
  subscribed,
  onToggle,
  onSubscribe,
}: DarkThemeSettingProps) {
  if (subscribed) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold flex items-center gap-2">
            <Moon size={16} />
            Тёмная тема
          </p>
          <p className="text-[12px] leading-snug text-app-muted mt-1">
            Комфортный тёмный интерфейс для вечернего использования
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 w-12 h-7 rounded-full transition-colors relative ${
            enabled ? 'bg-brand-green' : 'bg-app-border'
          }`}
        >
          <div
            className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-pill transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold flex items-center gap-2">
            <Moon size={16} className="text-brand-greenDark" />
            Тёмная тема
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#1C1C1E] to-[#3A3A3C] px-2 py-0.5 text-[10px] font-bold text-white">
              <Sparkles size={10} />
              PRO
            </span>
          </p>
          <p className="text-[13px] leading-snug text-app-text mt-1.5 font-medium">
            Меньше нагрузки на глаза — идеально вечером и в тёмном Telegram
          </p>
        </div>
        <button
          type="button"
          onClick={onSubscribe}
          className="shrink-0 w-12 h-7 rounded-full bg-app-border relative opacity-90"
          aria-label="Разблокировать тёмную тему"
        >
          <div className="w-6 h-6 bg-white rounded-full absolute top-0.5 translate-x-0.5 shadow-pill flex items-center justify-center">
            <Lock size={11} className="text-app-muted" />
          </div>
        </button>
      </div>

      <DarkThemePreview />

      <ul className="space-y-1 text-[12px] text-app-muted">
        <li>· Чёрный OLED-фон — комфортнее для глаз</li>
        <li>· Эксклюзив только для подписчиков Primeform</li>
      </ul>

      <button type="button" onClick={onSubscribe} className="btn-dark">
        Разблокировать тёмную тему — 400 ₽/мес
      </button>
    </div>
  );
}
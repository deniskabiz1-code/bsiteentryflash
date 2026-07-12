import { GOAL_OPTIONS } from '@/types';

interface GoalSelectorProps {
  selected: string[];
  onToggle: (key: string) => void;
  compact?: boolean;
  dense?: boolean;
  fill?: boolean;
}

export default function GoalSelector({ selected, onToggle, compact, dense, fill }: GoalSelectorProps) {
  const optionGap = dense ? 'gap-1.5' : compact ? 'gap-2' : 'gap-3';

  return (
    <div className={`flex w-full min-h-0 flex-col text-left ${fill ? 'flex-1' : ''}`}>
      <div className="shrink-0">
        <p className={`font-semibold text-app-text ${dense ? 'text-[14px]' : 'text-[15px]'}`}>
          Что хотите улучшить?
        </p>
        {!dense && (
          <p className={`text-app-muted ${compact ? 'text-[12px] mt-0.5' : 'text-[13px] mt-1'}`}>
            Выберите одну или несколько целей
          </p>
        )}
      </div>
      <div className={`mt-2 flex min-h-0 flex-col ${optionGap} ${fill ? 'flex-1' : ''}`}>
        {GOAL_OPTIONS.map(({ key, title, description }) => {
          const active = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`w-full rounded-2xl border text-left transition-all ${
                fill ? 'flex min-h-0 flex-1 flex-col justify-center' : ''
              } ${
                dense ? 'px-3.5 py-2' : compact ? 'px-4 py-3' : 'px-5 py-4'
              } ${
                active
                  ? 'border-brand-green bg-brand-green text-white'
                  : 'border-app-border bg-app-surface text-app-text'
              }`}
            >
              <p className={`font-semibold ${dense ? 'text-[13px]' : compact ? 'text-[15px]' : 'text-[15px]'}`}>
                {title}
              </p>
              {!dense && (
                <p className={`leading-snug ${compact ? 'text-[12px] mt-0.5' : 'text-[13px] mt-1'} ${active ? 'text-white/80' : 'text-app-muted'}`}>
                  {description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
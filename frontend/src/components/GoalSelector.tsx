import { GOAL_OPTIONS } from '@/types';

interface GoalSelectorProps {
  selected: string[];
  onToggle: (key: string) => void;
  compact?: boolean;
  dense?: boolean;
}

export default function GoalSelector({ selected, onToggle, compact, dense }: GoalSelectorProps) {
  return (
    <div className={`text-left w-full ${dense ? 'space-y-1.5' : compact ? 'space-y-2' : 'space-y-3'}`}>
      <div>
        <p className={`font-semibold text-app-text ${dense ? 'text-[14px]' : 'text-[15px]'}`}>
          Что хотите улучшить?
        </p>
        {!dense && (
          <p className={`text-app-muted ${compact ? 'text-[12px] mt-0.5' : 'text-[13px] mt-1'}`}>
            Выберите одну или несколько целей
          </p>
        )}
      </div>
      {GOAL_OPTIONS.map(({ key, title, description }) => {
        const active = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`w-full rounded-2xl text-left border transition-all ${
              dense ? 'py-2 px-3.5' : compact ? 'py-2.5 px-4' : 'py-4 px-5'
            } ${
              active
                ? 'border-brand-green bg-brand-green text-white'
                : 'border-app-border bg-app-surface text-app-text'
            }`}
          >
            <p className={`font-semibold ${dense ? 'text-[13px]' : compact ? 'text-[14px]' : 'text-[15px]'}`}>
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
  );
}
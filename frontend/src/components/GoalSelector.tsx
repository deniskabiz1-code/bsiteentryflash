import { GOAL_OPTIONS } from '@/types';

interface GoalSelectorProps {
  selected: string[];
  onToggle: (key: string) => void;
  compact?: boolean;
}

export default function GoalSelector({ selected, onToggle, compact }: GoalSelectorProps) {
  return (
    <div className={`text-left w-full ${compact ? 'space-y-2' : 'space-y-3'}`}>
      <div>
        <p className="text-[15px] font-semibold text-app-text">Что хотите улучшить?</p>
        <p className={`text-app-muted ${compact ? 'text-[12px] mt-0.5' : 'text-[13px] mt-1'}`}>
          Выберите одну или несколько целей
        </p>
      </div>
      {GOAL_OPTIONS.map(({ key, title, description }) => {
        const active = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`w-full rounded-2xl text-left border transition-all ${
              compact ? 'py-2.5 px-4' : 'py-4 px-5'
            } ${
              active
                ? 'border-brand-green bg-brand-green text-white'
                : 'border-app-border bg-app-surface text-app-text'
            }`}
          >
            <p className={`font-semibold ${compact ? 'text-[14px]' : 'text-[15px]'}`}>{title}</p>
            <p className={`leading-snug ${compact ? 'text-[12px] mt-0.5' : 'text-[13px] mt-1'} ${active ? 'text-white/80' : 'text-app-muted'}`}>
              {description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
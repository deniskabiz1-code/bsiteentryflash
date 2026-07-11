import { GOAL_OPTIONS } from '@/types';

interface GoalSelectorProps {
  selected: string[];
  onToggle: (key: string) => void;
}

export default function GoalSelector({ selected, onToggle }: GoalSelectorProps) {
  return (
    <div className="space-y-3 text-left w-full">
      <div>
        <p className="text-[15px] font-semibold text-app-text">Что хотите улучшить?</p>
        <p className="text-[13px] text-app-muted mt-1">Выберите одну или несколько целей</p>
      </div>
      {GOAL_OPTIONS.map(({ key, title, description }) => {
        const active = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`w-full py-4 px-5 rounded-2xl text-left border transition-all ${
              active
                ? 'border-app-text bg-app-text text-white'
                : 'border-app-border bg-app-surface text-app-text'
            }`}
          >
            <p className="text-[15px] font-semibold">{title}</p>
            <p className={`text-[13px] mt-1 leading-snug ${active ? 'text-white/80' : 'text-app-muted'}`}>
              {description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
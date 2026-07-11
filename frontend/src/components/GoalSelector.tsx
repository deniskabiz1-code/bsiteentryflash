import { GOAL_OPTIONS } from '@/types';

const GOAL_STYLES: Record<string, { active: string; idle: string }> = {
  skin: {
    active: 'border-accent-teal bg-accent-teal text-white',
    idle: 'border-accent-teal/25 bg-accent-tealLight/60 text-app-text',
  },
  face: {
    active: 'border-accent-violet bg-accent-violet text-white',
    idle: 'border-accent-violet/25 bg-accent-violetLight/80 text-app-text',
  },
  style: {
    active: 'border-accent-coral bg-accent-coral text-white',
    idle: 'border-accent-coral/25 bg-accent-coralLight/80 text-app-text',
  },
};

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
        const style = GOAL_STYLES[key] || GOAL_STYLES.face;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`w-full rounded-2xl text-left border-2 transition-all ${
              compact ? 'py-2.5 px-4' : 'py-4 px-5'
            } ${active ? style.active : style.idle}`}
          >
            <p className={`font-semibold ${compact ? 'text-[14px]' : 'text-[15px]'}`}>{title}</p>
            <p className={`leading-snug ${compact ? 'text-[12px] mt-0.5' : 'text-[13px] mt-1'} ${active ? 'text-white/85' : 'text-app-muted'}`}>
              {description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
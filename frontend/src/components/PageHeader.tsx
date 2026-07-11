import { HelpCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface PageHeaderProps {
  onHelp?: () => void;
}

export default function PageHeader({ onHelp }: PageHeaderProps) {
  const { user } = useApp();
  const initial = (user?.name || 'P').charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between py-2">
      <div className="icon-btn">{initial}</div>
      <button
        type="button"
        onClick={onHelp}
        className="icon-btn text-app-muted"
        aria-label="Помощь"
      >
        <HelpCircle size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
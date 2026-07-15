import { useNavigate } from 'react-router-dom';
import { ChevronRight, Gift } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function FreeAnalysisEntryCard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const credits = user?.referralCredits ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate('/free-analysis')}
      className="card-green w-full text-left space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Gift size={22} className="shrink-0 text-brand-greenDark mt-0.5" />
          <div>
            <p className="text-[15px] font-bold text-brand-greenDark">Полные анализы</p>
            <p className="text-[13px] leading-snug text-app-muted mt-1">
              Пригласите друга — получите полный разбор бесплатно
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="shrink-0 text-brand-greenDark mt-1" />
      </div>
      <p className="text-[13px] text-app-muted pl-[34px]">
        Кредиты: <span className="font-bold text-brand-greenDark">{credits}</span>
      </p>
    </button>
  );
}
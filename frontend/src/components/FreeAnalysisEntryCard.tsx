import { useNavigate } from 'react-router-dom';
import { ChevronRight, Crown } from 'lucide-react';

export default function FreeAnalysisEntryCard() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/free-analysis')}
      className="card-green w-full text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Crown size={22} className="shrink-0 text-brand-greenDark mt-0.5" />
          <div>
            <p className="text-[15px] font-bold text-brand-greenDark">Полный анализ</p>
            <p className="text-[13px] leading-snug text-app-muted mt-1">
              Оценки бесплатно всегда · полный разбор по подписке
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="shrink-0 text-brand-greenDark mt-1" />
      </div>
    </button>
  );
}
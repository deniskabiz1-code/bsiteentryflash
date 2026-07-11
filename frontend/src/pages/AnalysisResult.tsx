import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { SCORE_LABELS, SKIN_TYPE_LABELS, PUFFINESS_LABELS } from '@/types';
import { getAnalysis } from '@/api/client';
import { toAnalysisResultView, type AnalysisResultView } from '@/utils/analysisView';
import { assetUrl } from '@/utils/assets';
import { useFirstAnalysisViewportLock } from '@/hooks/useFirstAnalysisViewportLock';

export default function AnalysisResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stateAnalysis = location.state?.analysis as AnalysisResultView | undefined;

  const [result, setResult] = useState<AnalysisResultView | null>(
    stateAnalysis ? toAnalysisResultView(stateAnalysis) : null,
  );
  const [loading, setLoading] = useState(Boolean(id && !stateAnalysis));
  const [error, setError] = useState('');
  const showCompact = Boolean(result && !loading && !error);
  const viewportRef = useFirstAnalysisViewportLock(showCompact);

  useEffect(() => {
    if (!id || stateAnalysis) return;

    const analysisId = parseInt(id, 10);
    if (Number.isNaN(analysisId)) {
      setError('Анализ не найден');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    getAnalysis(analysisId)
      .then((data) => setResult(toAnalysisResultView(data.analysis)))
      .catch(() => setError('Не удалось загрузить анализ'))
      .finally(() => setLoading(false));
  }, [id, stateAnalysis]);

  if (loading) {
    return (
      <div className="page flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result || error) {
    return (
      <div className="page">
        <div className="page-inner text-center pt-8">
          <p className="text-app-muted">{error || 'Результаты не найдены'}</p>
          <button type="button" onClick={() => navigate('/progress')} className="btn-light mt-4">
            К истории
          </button>
          <button type="button" onClick={() => navigate('/analysis')} className="btn-dark mt-3">
            Новый анализ
          </button>
        </div>
      </div>
    );
  }

  const overall = result.overall_score || 0;
  const isDemo = Boolean(result.demo);
  const scores = result.scores || {};
  const formattedDate = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      })
    : null;
  const topTip = result.improvement_tips?.[0];

  const screen = (
    <div ref={viewportRef} className="bg-app-canvas">
      <div className="page-inner analysis-result-grid h-full px-5 py-3">
        <header className="min-h-0 shrink-0 space-y-2 overflow-hidden text-center">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="pill-green inline-flex">
              <Sparkles size={14} />
              Анализ завершён
            </span>
            {isDemo && <span className="pill-gray">Демо</span>}
          </div>
          <p className="heading-lg">
            {overall}
            <span className="text-[18px] text-app-muted font-semibold">/100</span>
          </p>
          {formattedDate && (
            <p className="text-[13px] text-app-muted">{formattedDate}</p>
          )}
        </header>

        <div className="card flex min-h-0 flex-col overflow-hidden !p-3">
          <div className="flex min-h-0 flex-1 gap-3">
            {result.photoUrl ? (
              <img
                src={assetUrl(result.photoUrl)}
                alt="Анализ"
                className="h-full w-[38%] max-w-[7.5rem] flex-shrink-0 rounded-2xl object-cover"
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="label-sm mb-2">По параметрам</p>
              <div className="analysis-result-scores">
                {Object.entries(scores).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] text-app-muted">
                      {SCORE_LABELS[key]}
                    </span>
                    <span className="text-[13px] font-bold text-brand-greenDark">
                      {value as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2 border-t border-app-border pt-3">
            <div className="flex-1 rounded-xl bg-app-canvas px-3 py-2">
              <p className="text-[11px] text-app-muted">Тип кожи</p>
              <p className="text-[13px] font-semibold leading-tight">
                {SKIN_TYPE_LABELS[result.skin_type]}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-app-canvas px-3 py-2">
              <p className="text-[11px] text-app-muted">Отёчность</p>
              <p className="text-[13px] font-semibold leading-tight">
                {PUFFINESS_LABELS[result.puffiness]}
              </p>
            </div>
          </div>

          {topTip && (
            <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-app-muted">
              {topTip}
            </p>
          )}
        </div>

        <footer className="min-h-0 shrink-0 space-y-2 overflow-hidden pb-1">
          <button
            type="button"
            onClick={() => navigate('/progress')}
            className="btn-accent"
          >
            Смотреть прогресс
          </button>
          <div className="btn-row">
            <button type="button" onClick={() => navigate('/')} className="btn-light">
              Главная
            </button>
            <button type="button" onClick={() => navigate('/analysis')} className="btn-dark">
              Новый анализ
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(screen, document.body);
}
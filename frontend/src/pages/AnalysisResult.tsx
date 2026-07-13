import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPayment, getAnalysis } from '@/api/client';
import SkincareRoutineSection from '@/components/SkincareRoutineSection';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import { SCORE_LABELS, SKIN_TYPE_LABELS, PUFFINESS_LABELS } from '@/types';
import { toAnalysisResultView, type AnalysisResultView } from '@/utils/analysisView';
import { assetUrl } from '@/utils/assets';

export default function AnalysisResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();
  const { openLink, haptic } = useTelegram();
  const stateAnalysis = location.state?.analysis as AnalysisResultView | undefined;

  const [result, setResult] = useState<AnalysisResultView | null>(
    stateAnalysis ? toAnalysisResultView(stateAnalysis) : null,
  );
  const [loading, setLoading] = useState(Boolean(id && !stateAnalysis));
  const [error, setError] = useState('');

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

  const handleSubscribe = async () => {
    try {
      const data = await createPayment();
      openLink(data.paymentUrl);
    } catch {
      haptic('error');
    }
  };

  const overall = result.overall_score || 0;
  const isDemo = Boolean(result.demo);
  const subscribed = Boolean(user?.subscriptionActive);
  const scores = result.scores || {};
  const formattedDate = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="page">
      <div className="page-inner space-y-6">
        {result.photoUrl && (
          <div className="flex justify-center pt-2">
            <img
              src={assetUrl(result.photoUrl)}
              alt="Анализ"
              className="h-40 w-40 rounded-3xl object-cover shadow-card"
            />
          </div>
        )}

        <section className="text-center pt-2">
          {formattedDate && (
            <p className="label-sm mb-2">{formattedDate}</p>
          )}
          <p className="label-sm mb-3">Общий балл</p>
          <p className="heading-xl">
            {overall}
            <span className="text-[20px] text-app-muted font-semibold">/100</span>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="pill-green">Анализ завершён</span>
            {isDemo && (
              <span className="pill-gray">Демо · ИИ не подключён</span>
            )}
          </div>
        </section>

        <section className="card-green">
          <p className="label-sm mb-3">По параметрам</p>
          <div className="space-y-0">
            {Object.entries(scores).map(([key, value]) => (
              <div key={key} className="list-row">
                <span className="text-[15px] text-app-text">{SCORE_LABELS[key]}</span>
                <span className="text-[15px] font-bold text-brand-greenDark">{value as number}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card space-y-0">
          <div className="list-row">
            <span className="text-[15px] text-app-muted">Тип кожи</span>
            <span className="text-[15px] font-semibold">{SKIN_TYPE_LABELS[result.skin_type]}</span>
          </div>
          <div className="list-row">
            <span className="text-[15px] text-app-muted">Отёчность</span>
            <span className="text-[15px] font-semibold">{PUFFINESS_LABELS[result.puffiness]}</span>
          </div>
        </section>

        {result.problem_zones?.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Проблемные зоны</h2>
            <div className="card space-y-4">
              {result.problem_zones.map((zone, i) => (
                <div key={i} className={i > 0 ? 'pt-4 border-t border-app-border' : ''}>
                  <p className="font-semibold text-[15px]">{zone.zone}</p>
                  <p className="text-[14px] text-app-muted mt-1 leading-relaxed">{zone.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.improvement_tips?.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Рекомендации</h2>
            <div className="card space-y-3">
              {result.improvement_tips.map((tip, i) => (
                <p key={i} className="text-[14px] leading-relaxed">• {tip}</p>
              ))}
            </div>
          </section>
        )}

        {result.growth_plan?.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">План роста</h2>
            <div className="space-y-3">
              {result.growth_plan.map((step) => (
                <div key={step.step} className="card">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-app-text text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {step.step}
                    </span>
                    <div>
                      <p className="font-semibold text-[15px]">{step.action}</p>
                      <p className="text-[13px] text-app-muted mt-2">{step.timeline}</p>
                      <p className="text-[13px] text-brand-greenDark font-medium mt-1">{step.progress_metric}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <SkincareRoutineSection
          routine={subscribed ? (result.skincare_routine ?? []) : []}
          subscribed={subscribed}
          onSubscribe={subscribed ? undefined : handleSubscribe}
        />

        <div className="btn-row pb-4">
          <button type="button" onClick={() => navigate('/progress')} className="btn-light">
            История
          </button>
          <button type="button" onClick={() => navigate('/analysis')} className="btn-dark">
            Новый анализ
          </button>
        </div>
      </div>
    </div>
  );
}
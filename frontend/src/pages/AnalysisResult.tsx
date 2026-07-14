import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPayment, getAnalysis } from '@/api/client';
import SkincareRoutineSection from '@/components/SkincareRoutineSection';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import { SCORE_LABELS, SKIN_TYPE_LABELS, PUFFINESS_LABELS } from '@/types';
import { scoreBarTone, scoreInsightLabel, scoreInsightTone } from '@/utils/scoreInsight';
import AnalysisPhoto from '@/components/AnalysisPhoto';
import AnalysisPhotoDisclaimer from '@/components/AnalysisPhotoDisclaimer';
import { toAnalysisResultView, type AnalysisResultView } from '@/utils/analysisView';

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
    if (!id) {
      if (stateAnalysis) setResult(toAnalysisResultView(stateAnalysis));
      return;
    }

    const analysisId = parseInt(id, 10);
    if (Number.isNaN(analysisId)) {
      setError('Анализ не найден');
      setLoading(false);
      return;
    }

    if (stateAnalysis?.id === analysisId) {
      setResult(toAnalysisResultView(stateAnalysis));
      setLoading(false);
      setError('');
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
  const subscribed = Boolean(user?.subscriptionActive);
  const scores = result.scores || {};
  const progress = result.progress_vs_last;
  const metricDeltas = progress?.has_previous ? progress.metric_deltas : null;

  const formatDelta = (value: number) => `${value >= 0 ? '+' : ''}${value}`;
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
        {(result.photoUrl || result.id) && (
          <div className="flex justify-center pt-2">
            <AnalysisPhoto
              analysisId={result.id}
              photoUrl={result.photoUrl}
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
            {progress?.has_previous && progress.overall_delta !== 0 && (
              <span className={`pill-green ${progress.overall_delta < 0 ? '!bg-red-50 !text-red-600' : ''}`}>
                {formatDelta(progress.overall_delta)} с прошлого чек-ина
              </span>
            )}
          </div>
          <AnalysisPhotoDisclaimer className="mt-4 px-2 text-center" />
        </section>

        {result.summary && (
          <section className="card-green">
            <p className="label-sm mb-2">Главное по фото</p>
            <p className="text-[15px] leading-relaxed">{result.summary}</p>
          </section>
        )}

        {result.priority_focus && (
          <section className="card border-2 border-brand-green/30 bg-brand-green/5">
            <p className="label-sm mb-2 text-brand-greenDark">Приоритет на 2 недели</p>
            <p className="text-[15px] font-semibold leading-relaxed">{result.priority_focus}</p>
          </section>
        )}

        {progress?.has_previous && progress.summary && (
          <section className="card-green">
            <p className="label-sm mb-2">Динамика с прошлого анализа</p>
            <p className="text-[15px] leading-relaxed">{progress.summary}</p>
          </section>
        )}

        <section className="card-green">
          <p className="label-sm mb-3">По параметрам</p>
          <div className="space-y-4">
            {Object.entries(scores).map(([key, value]) => {
              const score = value as number;
              const delta = metricDeltas?.[key as keyof typeof metricDeltas];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div>
                      <p className="text-[15px] font-semibold text-app-text">{SCORE_LABELS[key]}</p>
                      <p className={`text-[12px] font-medium ${scoreInsightTone(score)}`}>
                        {scoreInsightLabel(score)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {typeof delta === 'number' && delta !== 0 && (
                        <span className={`text-[12px] font-semibold ${delta >= 0 ? 'text-brand-greenDark' : 'text-red-500'}`}>
                          {formatDelta(delta)}
                        </span>
                      )}
                      <span className="text-[15px] font-bold text-brand-greenDark">{score}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-app-track overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarTone(score)}`}
                      style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {result.strengths && result.strengths.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Сильные стороны</h2>
            <div className="card space-y-2.5">
              {result.strengths.map((item, i) => (
                <p key={i} className="text-[14px] leading-relaxed text-app-text">✓ {item}</p>
              ))}
            </div>
          </section>
        )}

        <section className="card space-y-3">
          <div className="list-row !py-0">
            <span className="text-[15px] text-app-muted">Тип кожи</span>
            <span className="text-[15px] font-semibold">{SKIN_TYPE_LABELS[result.skin_type]}</span>
          </div>
          <div className="list-row !py-0">
            <span className="text-[15px] text-app-muted">Отёчность</span>
            <span className="text-[15px] font-semibold">{PUFFINESS_LABELS[result.puffiness]}</span>
          </div>
          {result.hair_notes && (
            <div className="rounded-2xl bg-app-canvas px-4 py-3">
              <p className="text-[12px] font-semibold text-app-muted mb-1">Причёска</p>
              <p className="text-[14px] leading-relaxed">{result.hair_notes}</p>
            </div>
          )}
          {result.photo_feedback && (
            <div className="rounded-2xl bg-app-canvas px-4 py-3">
              <p className="text-[12px] font-semibold text-app-muted mb-1">Качество фото</p>
              <p className="text-[14px] leading-relaxed">{result.photo_feedback}</p>
            </div>
          )}
        </section>

        {result.quick_wins && result.quick_wins.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Быстрые шаги</h2>
            <div className="space-y-3">
              {result.quick_wins.map((win, i) => (
                <div key={i} className="card">
                  <p className="font-semibold text-[15px] leading-snug">{win.action}</p>
                  <p className="text-[13px] text-brand-greenDark font-medium mt-2">{win.impact}</p>
                </div>
              ))}
            </div>
          </section>
        )}

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
          skinContext={{
            skin_type: result.skin_type,
            puffiness: result.puffiness,
            problem_zones: result.problem_zones,
            scores: result.scores,
          }}
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
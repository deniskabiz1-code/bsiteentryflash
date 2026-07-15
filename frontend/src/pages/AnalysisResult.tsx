import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPayment, getAnalysis } from '@/api/client';
import AnalysisPaywallBanner from '@/components/AnalysisPaywallBanner';
import AnalysisResultSection from '@/components/AnalysisResultSection';
import SkincareRoutineSection from '@/components/SkincareRoutineSection';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import {
  SCORE_LABELS,
  SKIN_TYPE_LABELS,
  PUFFINESS_LABELS,
  FACE_SHAPE_LABELS,
  type AnalysisContentLevel,
} from '@/types';
import { scoreBarTone, scoreInsightLabel, scoreInsightTone } from '@/utils/scoreInsight';
import AnalysisPhoto from '@/components/AnalysisPhoto';
import AnalysisPhotoDisclaimer from '@/components/AnalysisPhotoDisclaimer';
import { BOT_HANDLE } from '@/config/bot';
import { toAnalysisResultView, type AnalysisResultView } from '@/utils/analysisView';

function resolveContentLevel(
  result: AnalysisResultView,
  subscribed: boolean,
): AnalysisContentLevel {
  if (result.contentLevel) return result.contentLevel;
  if (subscribed && result.accessTier === 'full') return 'premium';
  return 'preview';
}

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
  const contentLevel = resolveContentLevel(result, subscribed);
  const isPreview = contentLevel === 'preview';
  const showFullSections = contentLevel === 'full' || contentLevel === 'premium';
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
      <div className="page-inner space-y-5 pb-4">
        <section className="card">
          <div className="flex items-center gap-4">
            {(result.photoUrl || result.id) && (
              <AnalysisPhoto
                analysisId={result.id}
                photoUrl={result.photoUrl}
                alt="Анализ"
                className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-card"
              />
            )}
            <div className="min-w-0 flex-1">
              {formattedDate && <p className="label-sm mb-1">{formattedDate}</p>}
              <p className="text-[13px] text-app-muted">Общий балл</p>
              <p className="text-[40px] font-bold leading-none tracking-tight">
                {overall}
                <span className="text-[18px] font-semibold text-app-muted">/100</span>
              </p>
              {showFullSections && progress?.has_previous && progress.overall_delta !== 0 && (
                <span className={`mt-2 inline-flex pill-green text-[11px] ${progress.overall_delta < 0 ? '!bg-red-50 !text-red-600' : ''}`}>
                  {formatDelta(progress.overall_delta)} к прошлому
                </span>
              )}
            </div>
          </div>
        </section>

        {Object.keys(scores).length > 0 && (
          <>
            <p
              className="pointer-events-none -my-2 flex items-center justify-center text-[12px] font-semibold tracking-wide text-app-text opacity-50 select-none"
              aria-hidden
            >
              {BOT_HANDLE}
            </p>
            <AnalysisResultSection title="Баллы">
            <div className="card space-y-4">
              {Object.entries(scores).map(([key, value]) => {
                const score = value as number;
                const delta = metricDeltas?.[key as keyof typeof metricDeltas];
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold">{SCORE_LABELS[key]}</p>
                        <p className={`text-[11px] font-medium ${scoreInsightTone(score)}`}>
                          {scoreInsightLabel(score)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {showFullSections && typeof delta === 'number' && delta !== 0 && (
                          <span className={`text-[11px] font-semibold ${delta >= 0 ? 'text-brand-greenDark' : 'text-red-500'}`}>
                            {formatDelta(delta)}
                          </span>
                        )}
                        <span className="text-[15px] font-bold text-brand-greenDark">{score}</span>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-app-track">
                      <div
                        className={`h-full rounded-full ${scoreBarTone(score)}`}
                        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-4 border-t border-app-border pt-3 text-[13px]">
                <div className="flex-1">
                  <p className="text-app-muted">Тип кожи</p>
                  <p className="mt-0.5 font-semibold">{SKIN_TYPE_LABELS[result.skin_type]}</p>
                </div>
                <div className="flex-1">
                  <p className="text-app-muted">Отёчность</p>
                  <p className="mt-0.5 font-semibold">{PUFFINESS_LABELS[result.puffiness]}</p>
                </div>
              </div>
            </div>
          </AnalysisResultSection>
          </>
        )}

        {result.summary && (
          <AnalysisResultSection title="Обзор">
            <p className="card text-[15px] leading-relaxed">{result.summary}</p>
          </AnalysisResultSection>
        )}

        {isPreview && (
          <AnalysisPaywallBanner
            onSubscribe={handleSubscribe}
            overallScore={overall}
            scores={scores}
            skinType={result.skin_type}
          />
        )}

        {showFullSections && result.strengths && result.strengths.length > 0 && (
          <AnalysisResultSection title="Сильные стороны">
            <ul className="card space-y-3">
              {result.strengths.map((item, i) => (
                <li key={i} className="flex gap-2 text-[14px] leading-snug">
                  <span className="shrink-0 font-bold text-brand-greenDark">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </AnalysisResultSection>
        )}

        {showFullSections && result.problem_zones && result.problem_zones.length > 0 && (
          <AnalysisResultSection title="Зоны внимания">
            <div className="card space-y-4">
              {result.problem_zones.map((zone, i) => (
                <div key={i} className={i > 0 ? 'border-t border-app-border pt-4' : ''}>
                  <p className="text-[14px] font-semibold">{zone.zone}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-app-muted">{zone.description}</p>
                </div>
              ))}
            </div>
          </AnalysisResultSection>
        )}

        {showFullSections && result.quick_wins && result.quick_wins.length > 0 && (
          <AnalysisResultSection title="Быстрые улучшения">
            <div className="card space-y-4">
              {result.quick_wins.map((win, i) => (
                <div key={i} className={i > 0 ? 'border-t border-app-border pt-4' : ''}>
                  <p className="text-[14px] font-medium leading-snug">{win.action}</p>
                  <p className="mt-1 text-[13px] text-brand-greenDark">{win.impact}</p>
                </div>
              ))}
            </div>
          </AnalysisResultSection>
        )}

        {showFullSections && result.improvement_tips && result.improvement_tips.length > 0 && (
          <AnalysisResultSection title="Советы">
            <ul className="card space-y-3">
              {result.improvement_tips.map((tip, i) => (
                <li key={i} className="text-[14px] leading-snug text-app-text">
                  · {tip}
                </li>
              ))}
            </ul>
          </AnalysisResultSection>
        )}

        {showFullSections && progress?.has_previous && progress.summary && (
          <AnalysisResultSection title="Динамика">
            <p className="card text-[14px] leading-relaxed text-brand-greenDark">{progress.summary}</p>
          </AnalysisResultSection>
        )}

        {!isPreview && (
          <SkincareRoutineSection
            title="Подборка ухода"
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
        )}

        {showFullSections && (result.best_haircuts?.length ?? 0) > 0 && (
          <AnalysisResultSection title="Лучшие стрижки">
            <div className="card space-y-4">
              {result.face_shape && (
                <span className="pill-gray text-[11px]">
                  Форма лица · {FACE_SHAPE_LABELS[result.face_shape] || result.face_shape}
                </span>
              )}
              {result.hair_notes && (
                <p className="text-[14px] leading-relaxed text-app-muted">{result.hair_notes}</p>
              )}
              {result.best_haircuts!.map((cut, i) => (
                <div key={i} className={i > 0 || result.hair_notes ? 'border-t border-app-border pt-4' : ''}>
                  <p className="font-semibold text-[14px]">{cut.name}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-app-muted">{cut.description}</p>
                </div>
              ))}
            </div>
          </AnalysisResultSection>
        )}

        {showFullSections && result.haircuts_to_avoid && result.haircuts_to_avoid.length > 0 && (
          <AnalysisResultSection title="Стрижки — избегать">
            <ul className="card space-y-3">
              {result.haircuts_to_avoid.map((item, i) => (
                <li key={i} className="text-[14px] leading-snug text-red-500">
                  ✕ {item}
                </li>
              ))}
            </ul>
          </AnalysisResultSection>
        )}

        {showFullSections && result.growth_plan?.length > 0 && (
          <AnalysisResultSection title="План развития">
            <div className="card space-y-0 divide-y divide-app-border">
              {result.growth_plan.map((step) => (
                <div key={step.step} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-text text-[11px] font-bold text-white">
                    {step.step}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold leading-snug">{step.action}</p>
                    <p className="mt-1 text-[12px] text-app-muted">{step.timeline}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnalysisResultSection>
        )}

        <AnalysisPhotoDisclaimer className="px-1" />

        <div className="btn-row pt-2">
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
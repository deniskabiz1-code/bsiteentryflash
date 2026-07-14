import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPayment, getAnalysis } from '@/api/client';
import AnalysisResultSection from '@/components/AnalysisResultSection';
import SkincareRoutineSection from '@/components/SkincareRoutineSection';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import {
  SCORE_LABELS,
  SKIN_TYPE_LABELS,
  PUFFINESS_LABELS,
  FACE_SHAPE_LABELS,
} from '@/types';
import { scoreBarTone } from '@/utils/scoreInsight';
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

  const skinBullets: string[] = [];
  for (const zone of result.problem_zones ?? []) {
    skinBullets.push(`${zone.zone} — ${zone.description}`);
  }
  if ((result.quick_wins?.length ?? 0) > 0) {
    for (const win of result.quick_wins!) {
      skinBullets.push(win.action);
    }
  } else {
    for (const tip of result.improvement_tips ?? []) {
      skinBullets.push(tip);
    }
  }
  const hasSkinBlock = skinBullets.length > 0;

  return (
    <div className="page">
      <div className="page-inner space-y-5 pb-4">
        <section className="card space-y-4">
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
              <div className="mt-2 flex flex-wrap gap-1.5">
                {progress?.has_previous && progress.overall_delta !== 0 && (
                  <span className={`pill-green text-[11px] ${progress.overall_delta < 0 ? '!bg-red-50 !text-red-600' : ''}`}>
                    {formatDelta(progress.overall_delta)} к прошлому
                  </span>
                )}
              </div>
            </div>
          </div>

          {Object.keys(scores).length > 0 && (
            <div className="space-y-3 border-t border-app-border pt-4">
              {Object.entries(scores).map(([key, value]) => {
                const score = value as number;
                const delta = metricDeltas?.[key as keyof typeof metricDeltas];
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold">{SCORE_LABELS[key]}</p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {typeof delta === 'number' && delta !== 0 && (
                          <span className={`text-[10px] font-semibold ${delta >= 0 ? 'text-brand-greenDark' : 'text-red-500'}`}>
                            {formatDelta(delta)}
                          </span>
                        )}
                        <span className="text-[13px] font-bold text-brand-greenDark">{score}</span>
                      </div>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-app-track">
                      <div
                        className={`h-full rounded-full ${scoreBarTone(score)}`}
                        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-4 pt-1 text-[12px]">
                <p>
                  <span className="text-app-muted">Кожа </span>
                  <span className="font-semibold">{SKIN_TYPE_LABELS[result.skin_type]}</span>
                </p>
                <p>
                  <span className="text-app-muted">Отёчность </span>
                  <span className="font-semibold">{PUFFINESS_LABELS[result.puffiness]}</span>
                </p>
              </div>
            </div>
          )}

          {result.summary && (
            <p className="text-[14px] leading-snug text-app-muted">{result.summary}</p>
          )}

          {result.strengths && result.strengths.length > 0 && (
            <ul className="space-y-1">
              {result.strengths.map((item, i) => (
                <li key={i} className="text-[13px] leading-snug text-app-text">
                  <span className="text-brand-greenDark font-semibold">+ </span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {progress?.has_previous && progress.summary && (
            <p className="text-[13px] leading-snug text-brand-greenDark">{progress.summary}</p>
          )}

          <AnalysisPhotoDisclaimer className="border-t border-app-border pt-3" />
        </section>

        {hasSkinBlock && (
          <AnalysisResultSection title="Кожа">
            <ul className="card list-disc space-y-2 pl-5 text-[14px] leading-snug text-app-text marker:text-app-muted">
              {skinBullets.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </AnalysisResultSection>
        )}

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

        {/* ——— Стрижка ——— */}
        {(result.best_haircuts?.length ?? 0) > 0 && (
          <AnalysisResultSection title="Стрижка">
            <div className="card space-y-0 divide-y divide-app-border">
              <div className="flex items-center justify-between gap-2 pb-3">
                <p className="text-[14px] font-semibold">Лучшие варианты</p>
                {result.face_shape && (
                  <span className="pill-gray text-[11px]">
                    {FACE_SHAPE_LABELS[result.face_shape] || result.face_shape}
                  </span>
                )}
              </div>
              {result.hair_notes && (
                <p className="py-3 text-[13px] leading-relaxed text-app-muted">{result.hair_notes}</p>
              )}
              {result.best_haircuts!.map((cut, i) => (
                <div key={i} className="py-3">
                  <p className="font-semibold text-[14px]">{cut.name}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-app-muted">{cut.description}</p>
                </div>
              ))}
              {result.haircuts_to_avoid && result.haircuts_to_avoid.length > 0 && (
                <div className="pt-3">
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-app-muted">
                    Избегать
                  </p>
                  {result.haircuts_to_avoid.map((item, i) => (
                    <p key={i} className="py-1 text-[13px] text-red-500">✕ {item}</p>
                  ))}
                </div>
              )}
            </div>
          </AnalysisResultSection>
        )}

        {/* ——— План ——— */}
        {result.growth_plan?.length > 0 && (
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

        {result.photo_feedback && (
          <p className="px-1 text-center text-[12px] leading-relaxed text-app-muted">
            {result.photo_feedback}
          </p>
        )}

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
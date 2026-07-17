import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import MiniBarChart from '@/components/MiniBarChart';
import SegmentedControl from '@/components/SegmentedControl';
import SkincareRoutineSection from '@/components/SkincareRoutineSection';
import { createPayment, getDailyTasks, getAnalysisHistory, getSkincareRoutine, toggleTask } from '@/api/client';
import type { EnrichedSkincareStep } from '@/data/wildberriesSkincare';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import ConditionalScrollPage from '@/components/ConditionalScrollPage';
import { useDocumentScrollLock } from '@/hooks/useDocumentScrollLock';
import { Analysis, DailyFocusMeta, TaskGroup } from '@/types';
import { ChartPeriod, scoresForPeriod } from '@/utils/progressChart';
import { pluralizeBalls } from '@/utils/russianPlural';
export default function Home() {
  const { user } = useApp();
  const navigate = useNavigate();
  const { haptic, openLink } = useTelegram();

  const [streak, setStreak] = useState(0);
  const [dailyTip, setDailyTip] = useState('');
  const [tasks, setTasks] = useState<TaskGroup[]>([]);
  const [neverDo, setNeverDo] = useState<string[]>([]);
  const [focusMeta, setFocusMeta] = useState<DailyFocusMeta | null>(null);
  const [neverDoOpen, setNeverDoOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [faceAnalyses, setFaceAnalyses] = useState<Analysis[]>([]);
  const [period, setPeriod] = useState<ChartPeriod>('Месяц');
  const [weeklyDelta, setWeeklyDelta] = useState(0);
  const [skincare, setSkincare] = useState<EnrichedSkincareStep[]>([]);

  const handleSubscribe = useCallback(async () => {
    try {
      const data = await createPayment();
      openLink(data.paymentUrl);
    } catch {
      haptic('error');
    }
  }, [openLink, haptic]);

  const chartSeries = useMemo(
    () => scoresForPeriod(faceAnalyses, period),
    [faceAnalyses, period],
  );

  const load = async () => {
    try {
      const historyData = await getAnalysisHistory();
      const face = historyData.analyses?.filter((a: { type: string }) => a.type === 'face') || [];
      const hasFaceAnalysis = face.length > 0;

      if (hasFaceAnalysis) {
        const taskData = await getDailyTasks();
        setStreak(taskData.streak);
        setDailyTip(taskData.dailyTip);
        setTasks(taskData.tasks);
        setNeverDo(taskData.neverDo);
        setFocusMeta(taskData.focusMeta ?? null);
      } else {
        setStreak(0);
        setDailyTip('');
        setTasks([]);
        setNeverDo([]);
        setFocusMeta(null);
      }
      if (face.length > 0) {
        setFaceAnalyses(face);
        setScore(face[0].overallScore);
        if (face.length >= 2) {
          setWeeklyDelta((face[0].overallScore || 0) - (face[1].overallScore || 0));
        } else {
          setWeeklyDelta(0);
        }
      } else {
        setFaceAnalyses([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (user?.subscriptionActive) {
      getSkincareRoutine().then((d) => setSkincare(d.routine || [])).catch(() => {});
    } else {
      setSkincare([]);
    }
  }, [user?.subscriptionActive]);

  const handleToggle = async (taskKey: string) => {
    haptic('light');
    try {
      await toggleTask(taskKey);
      setTasks((prev) =>
        prev.map((group) => ({
          ...group,
          tasks: group.tasks.map((t) =>
            t.key === taskKey ? { ...t, completed: !t.completed } : t
          ),
        }))
      );
      const data = await getDailyTasks();
      setStreak(data.streak);
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = tasks.reduce(
    (acc, g) => acc + g.tasks.filter((t) => t.completed).length,
    0
  );
  const totalCount = tasks.reduce((acc, g) => acc + g.tasks.length, 0);
  const needsFirstAnalysis =
    (user?.faceAnalysisCount ?? 0) === 0
    && (user?.freeAnalysisAvailable ?? true);
  const hasAnalysis = (user?.faceAnalysisCount ?? 0) > 0;
  const focusSubtitle = focusMeta?.analysisDate
    ? `По анализу от ${new Date(focusMeta.analysisDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
    : 'Под ваши цели';

  const remeasureKey = `${hasAnalysis}-${neverDoOpen}-${completedCount}-${tasks.length}-${needsFirstAnalysis}-${score ?? 'x'}-${focusMeta?.fromAnalysis ?? 0}-${skincare.length}-${user?.subscriptionActive}-${contentLoading ? 0 : 1}`;
  useDocumentScrollLock(contentLoading);

  if (contentLoading) {
    return (
      <div className="page flex min-h-[60vh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <ConditionalScrollPage ready={!contentLoading} remeasureKey={remeasureKey}>
        {needsFirstAnalysis && (
          <button
            type="button"
            onClick={() => navigate('/analysis', { state: { firstAnalysis: true } })}
            className="card-green w-full py-4 text-center"
          >
            <p className="text-[15px] font-semibold text-brand-greenDark">Анализ бесплатно</p>
            <p className="mt-1 text-[13px] text-app-muted">Загрузите селфи и получите балл</p>
          </button>
        )}

        <section className="pt-2 pb-1 text-center">
          <p className="label-sm mb-3">Твой балл</p>
          <p className="heading-xl">
            <span className="anim-score-pop tabular-nums">{score ?? '-'}</span>
            <span className="text-[20px] font-semibold text-app-muted">/100</span>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="pill-green anim-scale-in">
              <TrendingUp size={14} />
              {weeklyDelta !== 0
                ? `${weeklyDelta >= 0 ? '+' : ''}${weeklyDelta} за неделю`
                : streak > 0
                  ? `серия ${streak} дн.`
                  : 'начни сегодня'}
            </span>
          </div>
        </section>

        <div className="btn-row">
          <button type="button" onClick={() => navigate('/analysis')} className="btn-dark">
            Новый анализ
          </button>
          <button type="button" onClick={() => navigate('/progress')} className="btn-light">
            Прогресс
          </button>
        </div>

        <section className="card-green">
          {needsFirstAnalysis ? (
            <>
              <p className="label-sm mb-2">Твой рост</p>
              <p className="text-[15px] leading-relaxed text-app-muted">
                График прогресса появится после первого анализа
              </p>
            </>
          ) : (
            <>
              <p className="label-sm mb-1">Твой рост</p>
              <p className="mb-4 text-[28px] font-bold tracking-tight">
                {score ?? '-'}
                {score != null && (
                  <span className="text-lg font-semibold text-app-muted">
                    {' '}
                    {pluralizeBalls(score)}
                  </span>
                )}
              </p>
              <MiniBarChart points={chartSeries.points} period={period} />
              <div className="mt-4">
                <SegmentedControl
                  options={['День', 'Неделя', 'Месяц', 'Год']}
                  value={period}
                  onChange={(value) => setPeriod(value as ChartPeriod)}
                />
              </div>
            </>
          )}
        </section>

        {hasAnalysis ? (
          <>
            <section>
              <div className="mb-4 px-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[17px] font-bold">Фокус на сегодня</h2>
                  <span className="pill-gray shrink-0">{completedCount}/{totalCount}</span>
                </div>
                <p className="mt-1 text-[13px] text-app-muted">{focusSubtitle}</p>
                {dailyTip && (
                  <p className="mt-3 text-[14px] leading-relaxed text-app-text">{dailyTip}</p>
                )}
              </div>

              <div className="space-y-4">
                {tasks.map((group) => (
                  <div key={group.category}>
                    <p className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wide text-app-muted">
                      {group.label}
                    </p>
                    <div className="card !p-0 overflow-hidden">
                      {group.tasks.map((task, index) => (
                        <button
                          key={task.key}
                          type="button"
                          onClick={() => handleToggle(task.key)}
                          className={`flex w-full items-center gap-3 px-5 py-4 transition-colors active:bg-app-canvas ${
                            index > 0 ? 'border-t border-app-border' : ''
                          }`}
                        >
                          <div
                            className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                              task.completed
                                ? 'anim-check-pop border-brand-green bg-brand-green'
                                : 'border-app-border bg-app-surface'
                            }`}
                          >
                            {task.completed && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="anim-scale-in">
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`flex-1 text-left text-[15px] leading-snug transition-colors duration-200 ${
                              task.completed ? 'text-app-muted line-through' : 'text-app-text'
                            }`}
                          >
                            {task.label}
                          </span>
                          {task.fromAnalysis && !task.completed && (
                            <span className="shrink-0 text-[10px] font-semibold text-brand-greenDark">AI</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <button
                type="button"
                onClick={() => setNeverDoOpen(!neverDoOpen)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-[15px] font-semibold">Что не стоит делать никогда</span>
                {neverDoOpen ? <ChevronUp size={18} className="text-app-muted" /> : <ChevronDown size={18} className="text-app-muted" />}
              </button>
              {neverDoOpen && (
                <div className="mt-3 pt-3 border-t border-app-border space-y-2">
                  {neverDo.map((item, i) => (
                    <p key={i} className="text-[14px] text-app-muted">✕ {item}</p>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="card">
            <p className="label-sm mb-2">Фокус на сегодня</p>
            <p className="text-[15px] leading-relaxed text-app-muted">
              После первого анализа здесь появится персональный план на день. До 5 задач из ваших результатов.
            </p>
          </section>
        )}

        <SkincareRoutineSection
          title="Мой уход за кожей"
          routine={skincare}
          subscribed={Boolean(user?.subscriptionActive)}
          onSubscribe={user?.subscriptionActive ? undefined : handleSubscribe}
          compact
        />
    </ConditionalScrollPage>
  );
}
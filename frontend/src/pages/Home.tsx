import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, ChevronDown, ChevronUp, Sparkles, TrendingUp } from 'lucide-react';
import MiniBarChart from '@/components/MiniBarChart';
import SegmentedControl from '@/components/SegmentedControl';
import { getDailyTasks, toggleTask, getAnalysisHistory } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import { TaskGroup } from '@/types';

export default function Home() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { haptic } = useTelegram();
  const justOnboarded = Boolean((location.state as { welcome?: boolean } | null)?.welcome);

  const [streak, setStreak] = useState(0);
  const [dailyTip, setDailyTip] = useState('');
  const [tasks, setTasks] = useState<TaskGroup[]>([]);
  const [neverDo, setNeverDo] = useState<string[]>([]);
  const [neverDoOpen, setNeverDoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [chartValues, setChartValues] = useState<number[]>([52, 55, 58, 60, 63, 65, 68, 70, 71, 72]);
  const [period, setPeriod] = useState('Месяц');
  const [weeklyDelta, setWeeklyDelta] = useState(0);

  const load = async () => {
    try {
      const [taskData, historyData] = await Promise.all([
        getDailyTasks(),
        getAnalysisHistory(),
      ]);
      setStreak(taskData.streak);
      setDailyTip(taskData.dailyTip);
      setTasks(taskData.tasks);
      setNeverDo(taskData.neverDo);

      const face = historyData.analyses?.filter((a: { type: string }) => a.type === 'face') || [];
      if (face.length > 0) {
        setScore(face[0].overallScore);
        const vals = [...face].reverse().map((a: { overallScore: number }) => a.overallScore || 0);
        while (vals.length < 10) vals.unshift(vals[0] || 50);
        setChartValues(vals.slice(-10));
        if (face.length >= 2) {
          setWeeklyDelta((face[0].overallScore || 0) - (face[1].overallScore || 0));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
  const needsFirstAnalysis = score === null;

  const startFirstAnalysis = () => {
    haptic('medium');
    navigate('/analysis');
  };

  if (loading) {
    return (
      <div className="page flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-inner space-y-6">
        {needsFirstAnalysis ? (
          <section className="card-green space-y-5 pt-6 pb-6 text-center">
            <div className="flex justify-center">
              <span className="pill-green">
                <Sparkles size={14} />
                1 анализ бесплатно
              </span>
            </div>

            <div>
              <h1 className="heading-md">
                {justOnboarded && user?.name
                  ? `Привет, ${user.name}!`
                  : user?.name
                    ? `${user.name}, начнём?`
                    : 'Сделайте первый анализ'}
              </h1>
              <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-app-muted">
                {justOnboarded
                  ? 'Профиль готов. Загрузите селфи — AI бесплатно оценит внешность и составит ваш план.'
                  : 'Загрузите селфи — AI оценит внешность и составит персональный план улучшений.'}
              </p>
            </div>

            <div className="mx-auto max-w-xs space-y-3 text-left">
              {[
                { step: '1', text: 'Сделайте селфи при хорошем свете' },
                { step: '2', text: 'Получите балл и рекомендации' },
                { step: '3', text: 'Следуйте ежедневным задачам' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-app-text text-[13px] font-bold text-white">
                    {item.step}
                  </span>
                  <span className="text-[14px] text-app-text">{item.text}</span>
                </div>
              ))}
            </div>

            <button type="button" onClick={startFirstAnalysis} className="btn-dark flex items-center justify-center gap-2">
              <Camera size={18} />
              Сделать первый анализ бесплатно
            </button>
          </section>
        ) : (
          <>
            <section className="text-center pt-2 pb-1">
              <p className="label-sm mb-3">Твой балл</p>
              <p className="heading-xl">
                {score}
                <span className="text-[20px] font-semibold text-app-muted">/100</span>
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="pill-green">
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
          </>
        )}

        <section className={needsFirstAnalysis ? 'card text-center py-10' : 'card-green'}>
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
                {score}
                <span className="text-lg font-semibold text-app-muted"> баллов</span>
              </p>
              <MiniBarChart values={chartValues} />
              <div className="mt-4">
                <SegmentedControl
                  options={['День', 'Неделя', 'Месяц', 'Год']}
                  value={period}
                  onChange={setPeriod}
                />
              </div>
            </>
          )}
        </section>

        <section className="card">
          <p className="label-sm mb-2">Совет дня</p>
          <p className="text-[15px] leading-relaxed text-app-text">{dailyTip}</p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[17px] font-bold">Задачи на сегодня</h2>
            <span className="pill-gray">{completedCount}/{totalCount}</span>
          </div>

          <div className="card !p-0 overflow-hidden">
            {tasks.map((group) => (
              <div key={group.category}>
                <p className="px-5 pt-4 pb-2 text-[13px] font-semibold text-app-muted">{group.label}</p>
                {group.tasks.map((task) => (
                  <button
                    key={task.key}
                    type="button"
                    onClick={() => handleToggle(task.key)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-app-border active:bg-app-canvas transition-colors"
                  >
                    <div
                      className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        task.completed
                          ? 'bg-brand-green border-brand-green'
                          : 'border-app-border bg-app-surface'
                      }`}
                    >
                      {task.completed && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[15px] text-left flex-1 ${task.completed ? 'text-app-muted line-through' : 'text-app-text'}`}>
                      {task.label}
                    </span>
                  </button>
                ))}
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
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTgWebApp } from '@/lib/tgWebApp';
import { completeOnboarding, checkChannel, getChannelInfo } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import { GOAL_LABELS } from '@/types';

const GOALS = ['skin', 'face', 'style'] as const;

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useApp();
  const { openTelegramLink, haptic } = useTelegram();

  const [step, setStep] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [channelOpenUrl, setChannelOpenUrl] = useState('https://t.me/primeform_channel');
  const [channelUsername, setChannelUsername] = useState('primeform_channel');

  useEffect(() => {
    getChannelInfo()
      .then((info) => {
        setChannelOpenUrl(info.link);
        setChannelUsername(info.username);
      })
      .catch(() => {});
  }, []);

  const checkSubscription = useCallback(async () => {
    setChecking(true);
    setError('');
    setHint('');
    try {
      const data = await checkChannel();
      setSubscribed(data.subscribed);
      if (data.subscribed) {
        haptic('success');
        setStep(1);
      } else {
        haptic('error');
        setError(data.error || 'Подпишитесь на канал, чтобы продолжить');
        setHint(data.hint || '');
      }
    } catch {
      setError('Ошибка проверки подписки');
    } finally {
      setChecking(false);
    }
  }, [haptic]);

  useEffect(() => {
    const onActivated = () => {
      if (step === 0) checkSubscription();
    };
    const webApp = getTgWebApp();
    if (!webApp) return;
    webApp.onEvent('activated', onActivated);
    return () => webApp.offEvent('activated', onActivated);
  }, [step, checkSubscription]);

  const openChannel = () => {
    openTelegramLink(channelOpenUrl, channelUsername);
  };

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
    haptic('light');
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Укажите имя'); return; }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 14 || ageNum > 60) {
      setError('Возраст от 14 до 60');
      return;
    }
    if (goals.length === 0) { setError('Выберите хотя бы одну цель'); return; }

    setLoading(true);
    setError('');
    setHint('');
    try {
      await completeOnboarding({ name: name.trim(), age: ageNum, goals });
      await refreshUser();
      haptic('success');
      navigate('/');
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { error?: string; hint?: string } } })?.response?.data;
      setError(res?.error || 'Ошибка сохранения');
      setHint(res?.hint || '');
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : 'P';

  return (
    <div className="page flex flex-col">
      <div className="page-inner flex-1 flex flex-col">
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 pb-32">
            <div className="w-28 h-28 rounded-full bg-app-surface shadow-float flex items-center justify-center text-5xl font-bold mb-8">
              {initial}
            </div>
            <h1 className="heading-md mb-3">Добро пожаловать в Primeform</h1>
            <p className="text-[15px] text-app-muted leading-relaxed max-w-xs mb-2">
              AI-ассистент для улучшения внешности
            </p>
            <p className="text-[14px] text-app-muted mb-4">
              Подпишитесь на канал, чтобы начать
            </p>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {hint && <p className="text-amber-600 text-xs mb-4 max-w-xs">{hint}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col items-center pt-6 pb-32">
            <div className="w-28 h-28 rounded-full bg-app-surface shadow-float flex items-center justify-center text-5xl font-bold mb-4">
              {initial}
            </div>

            {name && <span className="pill-gray mb-8">@{name.toLowerCase().replace(/\s/g, '')}</span>}

            <h1 className="heading-md text-center mb-2">Настройка профиля</h1>
            <p className="text-[15px] text-app-muted text-center mb-8">Можно изменить в любой момент</p>

            <div className="w-full space-y-4">
              <input
                className="input-field"
                placeholder="Как вас зовут?"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="input-field"
                type="number"
                min={14}
                max={60}
                placeholder="Возраст (14–60)"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />

              <div className="space-y-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`w-full py-4 px-5 rounded-2xl text-left text-[15px] font-semibold border transition-all ${
                      goals.includes(goal)
                        ? 'border-app-text bg-app-text text-white'
                        : 'border-app-border bg-app-surface text-app-text'
                    }`}
                  >
                    {GOAL_LABELS[goal]}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-app-canvas via-app-canvas to-transparent">
        <div className="max-w-md mx-auto space-y-3">
          {step === 0 && (
            <>
              <button type="button" onClick={openChannel} className="btn-dark">
                Подписаться на @{channelUsername}
              </button>
              <button type="button" onClick={checkSubscription} disabled={checking} className="btn-light">
                {checking ? 'Проверяем...' : subscribed ? '✓ Подписка подтверждена' : 'Я подписался — проверить'}
              </button>
            </>
          )}
          {step === 1 && (
            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-dark">
              {loading ? 'Сохраняем...' : 'Продолжить'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
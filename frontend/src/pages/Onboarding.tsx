import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTgWebApp, setVerticalSwipeLock } from '@/lib/tgWebApp';
import { completeOnboarding, checkChannel, getChannelInfo } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';
import { useTelegramPhoto } from '@/hooks/useTelegramPhoto';
import AgeSlider from '@/components/AgeSlider';
import GoalSelector from '@/components/GoalSelector';
import UserAvatar from '@/components/UserAvatar';
import { DEFAULT_CHANNEL_URL, DEFAULT_CHANNEL_USERNAME } from '@/config/channel';

export default function Onboarding() {
  const navigate = useNavigate();
  const { applyUser } = useApp();
  const submittingRef = useRef(false);
  const nameSeededFromTelegram = useRef(false);
  const { user: tgUser, openTelegramLink, haptic } = useTelegram();

  const [step, setStep] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(14);
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [channelOpenUrl, setChannelOpenUrl] = useState(DEFAULT_CHANNEL_URL);
  const [channelUsername, setChannelUsername] = useState(DEFAULT_CHANNEL_USERNAME);

  const photoUrl = useTelegramPhoto();

  useEffect(() => {
    document.documentElement.classList.add('pf-onboarding');
    setVerticalSwipeLock(true);

    const blockScroll = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Element
        && target.closest('input, textarea, select, button, label, [data-touch-interactive]')
      ) {
        return;
      }
      if (event.cancelable) event.preventDefault();
    };
    document.addEventListener('touchmove', blockScroll, { passive: false });
    document.addEventListener('wheel', blockScroll, { passive: false });

    return () => {
      document.documentElement.classList.remove('pf-onboarding');
      setVerticalSwipeLock(false);
      document.removeEventListener('touchmove', blockScroll);
      document.removeEventListener('wheel', blockScroll);
    };
  }, []);

  useEffect(() => {
    if (nameSeededFromTelegram.current || !tgUser?.first_name) return;
    setName(tgUser.first_name);
    nameSeededFromTelegram.current = true;
  }, [tgUser]);

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
    if (loading || submittingRef.current) return;
    if (!name.trim()) { setError('Укажите имя'); return; }
    if (age < 14 || age > 60) {
      setError('Возраст от 14 до 60');
      return;
    }
    if (goals.length === 0) { setError('Выберите хотя бы одну цель'); return; }

    submittingRef.current = true;
    setLoading(true);
    setError('');
    setHint('');
    try {
      const data = await completeOnboarding({ name: name.trim(), age, goals });
      const nextUser = data.user as User;
      applyUser(nextUser);
      haptic('success');
      if (nextUser.freeAnalysisAvailable) {
        navigate('/analysis', { replace: true, state: { welcome: true, firstAnalysis: true } });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { error?: string; hint?: string } } })?.response?.data;
      setError(res?.error || 'Ошибка сохранения');
      setHint(res?.hint || '');
      haptic('error');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const fallbackLetter = name.trim()
    ? name.trim().charAt(0)
    : (tgUser?.first_name?.charAt(0) || 'P');

  return (
    <div className="onboarding-page bg-app-canvas">
      <div className="page-inner flex min-h-0 flex-1 flex-col px-5 pb-[5.5rem] pt-2">
        {step === 0 && (
          <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-hidden text-center">
            <UserAvatar photoUrl={photoUrl} fallbackLetter={fallbackLetter} size="lg" className="mb-5" />
            <h1 className="heading-md mb-2">Добро пожаловать в Primeform</h1>
            <p className="mb-2 max-w-xs text-[14px] leading-snug text-app-muted">
              AI-ассистент для улучшения внешности
            </p>
            <p className="mb-3 text-[13px] text-app-muted">
              Подпишитесь на канал, чтобы начать
            </p>
            {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
            {hint && <p className="mb-3 max-w-xs text-xs text-amber-600">{hint}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-grid min-h-0 flex-1">
            <header className="shrink-0 text-center">
              <h1 className="text-[22px] font-bold tracking-tight">Настройка профиля</h1>
              <p className="mt-1 text-[13px] text-app-muted">Можно изменить в любой момент</p>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <input
                className="input-field shrink-0 text-center"
                placeholder="Как вас зовут?"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="shrink-0">
                <AgeSlider value={age} onChange={setAge} compact />
              </div>

              <GoalSelector selected={goals} onToggle={toggleGoal} compact fill />

              {error && <p className="shrink-0 text-center text-sm text-red-500">{error}</p>}
              {hint && <p className="shrink-0 text-center text-xs text-amber-600">{hint}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-app-canvas via-app-canvas to-transparent p-5">
        <div className="mx-auto max-w-md space-y-2">
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
            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-accent">
              {loading ? 'Сохраняем...' : 'Продолжить к анализу'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
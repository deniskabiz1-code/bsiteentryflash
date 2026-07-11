import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTgWebApp } from '@/lib/tgWebApp';
import { completeOnboarding, checkChannel, getChannelInfo } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';
import { useTelegramPhoto } from '@/hooks/useTelegramPhoto';
import AgeSlider from '@/components/AgeSlider';
import GoalSelector from '@/components/GoalSelector';
import UserAvatar from '@/components/UserAvatar';

export default function Onboarding() {
  const navigate = useNavigate();
  const { applyUser } = useApp();
  const submittingRef = useRef(false);
  const { user: tgUser, openTelegramLink, haptic } = useTelegram();

  const [step, setStep] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [channelOpenUrl, setChannelOpenUrl] = useState('https://t.me/primeform_channel');
  const [channelUsername, setChannelUsername] = useState('primeform_channel');

  const telegramUsername = tgUser?.username || null;
  const photoUrl = useTelegramPhoto();

  useEffect(() => {
    if (tgUser?.first_name && !name) {
      setName(tgUser.first_name);
    }
  }, [tgUser, name]);

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
      applyUser(data.user as User);
      haptic('success');
      navigate('/', { replace: true });
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
    <div className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-app-canvas">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="page-inner pb-36">
        {step === 0 && (
          <div className="flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center text-center px-2">
            <UserAvatar photoUrl={photoUrl} fallbackLetter={fallbackLetter} size="lg" className="mb-8" />
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
          <div className="flex min-h-[calc(100dvh-10rem)] w-full flex-col items-center justify-center px-2 py-6 text-center">
            <div className="flex w-full max-w-sm flex-col items-center">
              <div className="mb-6 flex flex-col items-center">
                <UserAvatar photoUrl={photoUrl} fallbackLetter={fallbackLetter} size="md" className="mb-3" />
                {telegramUsername && (
                  <span className="pill-gray">@{telegramUsername}</span>
                )}
              </div>

              <h1 className="text-[20px] font-bold tracking-tight mb-1">Настройка профиля</h1>
              <p className="text-[13px] text-app-muted mb-6">Можно изменить в любой момент</p>

              <div className="w-full space-y-4 text-left">
                <input
                  className="input-field text-center !py-3"
                  placeholder="Как вас зовут?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <AgeSlider value={age} onChange={setAge} compact />

                <GoalSelector selected={goals} onToggle={toggleGoal} compact />
              </div>

              {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
              {hint && <p className="text-amber-600 text-xs mt-2 text-center">{hint}</p>}
            </div>
          </div>
        )}
        </div>
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
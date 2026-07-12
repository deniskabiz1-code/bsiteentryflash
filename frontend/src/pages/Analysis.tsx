import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Sparkles } from 'lucide-react';

import PhotoUpload from '@/components/PhotoUpload';
import { analyzeFace } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import { useFirstAnalysisViewportLock } from '@/hooks/useFirstAnalysisViewportLock';
import { setVerticalSwipeLock } from '@/lib/tgWebApp';

export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useApp();
  const { haptic } = useTelegram();

  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const justOnboarded = Boolean(
    (location.state as { welcome?: boolean; firstAnalysis?: boolean } | null)?.firstAnalysis
    || (location.state as { welcome?: boolean } | null)?.welcome
  );
  const isFirstAnalysis = (user?.faceAnalysisCount ?? 0) === 0;
  const freeAnalysisAvailable = user?.freeAnalysisAvailable ?? isFirstAnalysis;
  const isBlockedFromFreeTrial = isFirstAnalysis && !freeAnalysisAvailable;
  const isMandatoryFirstFlow = isFirstAnalysis && freeAnalysisAvailable;
  const viewportRef = useFirstAnalysisViewportLock(isMandatoryFirstFlow);

  useEffect(() => {
    if (isFirstAnalysis) return;

    document.documentElement.classList.add('pf-analysis-upload');
    setVerticalSwipeLock(true);

    const blockScroll = (event: Event) => {
      if (event.cancelable) event.preventDefault();
    };
    document.addEventListener('touchmove', blockScroll, { passive: false });
    document.addEventListener('wheel', blockScroll, { passive: false });

    return () => {
      document.documentElement.classList.remove('pf-analysis-upload');
      setVerticalSwipeLock(false);
      document.removeEventListener('touchmove', blockScroll);
      document.removeEventListener('wheel', blockScroll);
    };
  }, [isFirstAnalysis]);

  const canAnalyze =
    Boolean(user?.subscriptionActive) ||
    (isFirstAnalysis && freeAnalysisAvailable) ||
    (user?.referralCredits ?? 0) > 0;

  const handleAnalyze = async () => {
    if (!photo) { setError('Загрузите фото'); return; }

    setLoading(true);
    setError('');
    try {
      const data = await analyzeFace(photo);
      haptic('success');
      await refreshUser();
      const analysisId = data.analysis?.id;
      navigate(
        analysisId ? `/analysis/result/${analysisId}` : '/analysis/result',
        { state: { analysis: data.analysis }, replace: true },
      );
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { error?: string }; status?: number };
        code?: string;
        message?: string;
      };
      const msg = ax.response?.data?.error;
      if (ax.code === 'ECONNABORTED') {
        setError('Сервер долго отвечает — подождите и повторите');
      } else if (!ax.response) {
        setError('Нет связи с сервером');
      } else if (ax.response.status === 403) {
        setError(msg || 'Бесплатный анализ уже использован');
      } else {
        setError(msg || 'Ошибка анализа');
      }
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.name?.trim();
  const shortName = displayName && displayName.length > 18
    ? `${displayName.slice(0, 16)}…`
    : displayName;
  const greeting = justOnboarded && shortName
    ? `Привет, ${shortName}!`
    : 'Ваш первый анализ';

  const analyzeLabel = loading
    ? 'Анализируем...'
    : photo
      ? isFirstAnalysis
        ? 'Начать бесплатный анализ'
        : 'Начать анализ'
      : 'Сначала сделайте селфи';

  const content = (
    <div
      className={`page-inner first-analysis-grid h-full px-5 ${
        isMandatoryFirstFlow ? 'py-3' : 'analysis-upload-dense py-2'
      }`}
    >
      <header className="min-h-0 shrink-0 overflow-hidden">
        {isBlockedFromFreeTrial ? (
          <div className="space-y-1.5">
            <h1 className="text-[20px] font-bold leading-tight tracking-tight">
              Бесплатный анализ недоступен
            </h1>
            <p className="text-[14px] leading-snug text-app-muted">
              Этот Telegram-аккаунт уже использовал бесплатный анализ.
            </p>
          </div>
        ) : isFirstAnalysis ? (
          <div className="space-y-1.5">
            <span className="pill-green inline-flex">
              <Sparkles size={14} />
              1 анализ бесплатно
            </span>
            <h1 className="text-[22px] font-bold leading-snug tracking-tight break-words">
              {greeting}
            </h1>
            <p className="text-[14px] leading-snug text-app-muted">
              Сделайте селфи — AI бесплатно оценит внешность.
            </p>
          </div>
        ) : (
          <h1 className="text-[20px] font-bold leading-tight tracking-tight">
            Анализ лица
          </h1>
        )}
      </header>

      {isBlockedFromFreeTrial ? (
        <div className="card flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden !p-5 text-center">
          <p className="text-[14px] leading-relaxed text-app-muted">
            Оформите подписку или получите реферальные кредиты, чтобы сделать анализ.
          </p>
        </div>
      ) : (
        <div className={`card flex min-h-0 h-full flex-col overflow-hidden ${isMandatoryFirstFlow ? '!p-4' : '!p-3'}`}>
          <PhotoUpload
            onPhotoSelect={setPhoto}
            label="Сделать селфи"
            compact
            fill
            dense={!isMandatoryFirstFlow}
          />
        </div>
      )}

      <footer className={`min-h-0 shrink-0 overflow-hidden ${isMandatoryFirstFlow ? 'space-y-2 pb-1' : 'space-y-1.5'}`}>
        {!canAnalyze && !isFirstAnalysis && (
          <p className="text-center text-[12px] leading-snug text-red-600">
            Нужна подписка.{' '}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="font-semibold underline"
            >
              Оформить
            </button>
          </p>
        )}
        {error && (
          <p className="text-center text-[13px] font-medium text-red-500 line-clamp-2">{error}</p>
        )}

        {isBlockedFromFreeTrial ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="btn-dark"
            >
              Оформить подписку
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-light"
            >
              На главную
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!photo || loading || !canAnalyze}
              className={isMandatoryFirstFlow ? 'btn-accent' : 'btn-dark !py-3.5'}
            >
              {analyzeLabel}
            </button>
            {user?.subscriptionActive && !isFirstAnalysis && (
              <button
                type="button"
                onClick={() => navigate('/analysis/hairstyle')}
                className="flex w-full items-center justify-center gap-1.5 py-1 text-[13px] font-semibold text-app-muted"
              >
                <Scissors size={15} />
                Анализ причёски
              </button>
            )}
          </>
        )}
      </footer>
    </div>
  );

  if (isMandatoryFirstFlow) {
    return createPortal(
      <div ref={viewportRef} className="bg-app-canvas">
        {content}
      </div>,
      document.body,
    );
  }

  return (
    <div className="page analysis-upload-page">
      {content}
    </div>
  );
}
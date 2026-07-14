import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Sparkles } from 'lucide-react';

import ConditionalScrollPage from '@/components/ConditionalScrollPage';
import PhotoUpload from '@/components/PhotoUpload';
import { analyzeFace } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { preparePhotoForUpload } from '@/utils/preparePhoto';
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
  const isMandatoryFirstFlow = isFirstAnalysis && freeAnalysisAvailable;
  const viewportRef = useFirstAnalysisViewportLock(isMandatoryFirstFlow);

  const canAnalyze =
    Boolean(user?.subscriptionActive) ||
    (isFirstAnalysis && freeAnalysisAvailable) ||
    (user?.referralCredits ?? 0) > 0;
  const noFreeAnalysisLeft = !canAnalyze && !user?.subscriptionActive;
  const useUploadScrollLock = !isMandatoryFirstFlow && !noFreeAnalysisLeft && !isFirstAnalysis;

  useEffect(() => {
    if (!useUploadScrollLock) return;

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
  }, [useUploadScrollLock]);

  const handleAnalyze = async () => {
    if (!photo) { setError('Загрузите фото'); return; }

    setLoading(true);
    setError('');
    try {
      const prepared = await preparePhotoForUpload(photo);
      const data = await analyzeFace(prepared);
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
      if (err instanceof Error && err.message.startsWith('Не удалось')) {
        setError(err.message);
      } else if (ax.code === 'ECONNABORTED') {
        setError('Сервер долго отвечает — подождите и повторите');
      } else if (!ax.response) {
        setError('Ошибка связи с сервером. Проверьте интернет и повторите.');
      } else if (ax.response.status === 403) {
        setError(msg || 'Бесплатный анализ уже использован');
      } else if (ax.response.status === 401) {
        setError('Сессия Telegram устарела — закройте и снова откройте приложение');
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
      className="page-inner first-analysis-grid h-full px-5 py-3"
    >
      <header className="min-h-0 shrink-0 overflow-hidden">
        {isFirstAnalysis ? (
          <div className="space-y-1.5">
            <span className="pill-green inline-flex">
              <Sparkles size={14} />
              1 анализ бесплатно
            </span>
            <h1 className="text-[22px] font-bold leading-snug tracking-tight break-words">
              {greeting}
            </h1>
            <p className="text-[14px] leading-snug text-app-muted">
              Сделайте селфи — ИИ бесплатно оценит внешность.
            </p>
          </div>
        ) : (
          <h1 className="text-[20px] font-bold leading-tight tracking-tight">
            Анализ лица
          </h1>
        )}
      </header>

      <div className="card flex h-full min-h-0 min-w-0 flex-col overflow-hidden !p-4">
          <PhotoUpload
            onPhotoSelect={setPhoto}
            onPhotoClear={() => setPhoto(null)}
            label="Сделать селфи"
            compact
            fill
          />
        </div>

      <footer className="analysis-upload-footer shrink-0 space-y-2">
        {error && (
          <p className="text-center text-[13px] font-medium text-red-500 line-clamp-2">{error}</p>
        )}

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!photo || loading || !canAnalyze}
          className={isMandatoryFirstFlow ? 'btn-accent' : 'btn-dark'}
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

  if (noFreeAnalysisLeft) {
    return (
      <ConditionalScrollPage innerClassName="page-inner space-y-6 pt-8" remeasureKey="no-credits">
        <h1 className="text-[20px] font-bold leading-tight tracking-tight text-center">
          Бесплатных анализов не осталось
        </h1>
        <div className="space-y-2 pt-4">
          <button
            type="button"
            onClick={() => navigate('/free-analysis')}
            className="btn-accent"
          >
            Получить бесплатный анализ
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn-dark"
          >
            Оформить подписку
          </button>
        </div>
      </ConditionalScrollPage>
    );
  }

  return (
    <div className="page analysis-upload-page">
      {content}
    </div>
  );
}
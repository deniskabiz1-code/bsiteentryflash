import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Sparkles } from 'lucide-react';

import PhotoUpload from '@/components/PhotoUpload';
import { analyzeFace } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';

const TIPS = [
  'Смотрите прямо в камеру с нейтральным выражением',
  'Обеспечьте хорошее освещение (лучше дневной свет)',
  'Уберите очки и головные уборы',
  'Держите камеру на уровне глаз',
];

export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const { haptic } = useTelegram();

  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const justOnboarded = Boolean(
    (location.state as { welcome?: boolean; firstAnalysis?: boolean } | null)?.firstAnalysis
    || (location.state as { welcome?: boolean } | null)?.welcome
  );
  const isFirstAnalysis = (user?.faceAnalysisCount ?? 0) === 0;

  const canAnalyze =
    user?.subscriptionActive ||
    isFirstAnalysis ||
    (user?.referralCredits ?? 0) > 0;

  useEffect(() => {
    if (!isFirstAnalysis) return;
    document.documentElement.classList.add('pf-first-analysis');
    return () => {
      document.documentElement.classList.remove('pf-first-analysis');
    };
  }, [isFirstAnalysis]);

  const handleAnalyze = async () => {
    if (!photo) { setError('Загрузите фото'); return; }

    setLoading(true);
    setError('');
    try {
      const data = await analyzeFace(photo);
      haptic('success');
      navigate('/analysis/result', { state: { analysis: data.analysis } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Ошибка анализа');
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  if (isFirstAnalysis) {
    const displayName = user?.name?.trim();
    const shortName = displayName && displayName.length > 18
      ? `${displayName.slice(0, 16)}…`
      : displayName;
    const greeting = justOnboarded && shortName
      ? `Привет, ${shortName}!`
      : 'Ваш первый анализ';

    return (
      <div className="first-analysis-viewport bg-app-canvas">
        <div className="page-inner flex min-h-0 flex-1 flex-col py-3 pb-4">
          <div className="card flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <div className="shrink-0 space-y-2">
              <span className="pill-green inline-flex">
                <Sparkles size={14} />
                1 анализ бесплатно
              </span>
              <h1 className="text-[22px] font-bold leading-snug tracking-tight break-words">
                {greeting}
              </h1>
              <p className="text-[14px] leading-relaxed text-app-muted">
                Сделайте селфи — AI бесплатно оценит внешность.
              </p>
            </div>

            <PhotoUpload
              onPhotoSelect={setPhoto}
              label="Сделать селфи"
              compact
              fill
            />

            {error && (
              <p className="shrink-0 text-sm font-medium text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!photo || loading || !canAnalyze}
              className="btn-accent shrink-0"
            >
              {loading
                ? 'Анализируем...'
                : photo
                  ? 'Начать бесплатный анализ'
                  : 'Сначала сделайте селфи'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-inner space-y-6">
        <section className="text-center pt-2">
          <p className="label-sm mb-2">AI-анализ</p>
          <h1 className="heading-md">Анализ лица</h1>
          <p className="text-[15px] text-app-muted mt-2">Загрузите селфи для оценки</p>
        </section>

        {!canAnalyze && (
          <div className="card border border-red-200 bg-red-50">
            <p className="text-[14px] text-red-700">
              Бесплатный анализ использован. Оформите подписку или получите реферальные кредиты.
            </p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="mt-3 text-[14px] font-semibold text-app-text underline"
            >
              Перейти в профиль
            </button>
          </div>
        )}

        <PhotoUpload onPhotoSelect={setPhoto} tips={TIPS} label="Сделать селфи" />

        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!photo || loading || !canAnalyze}
          className="btn-dark"
        >
          {loading ? 'Анализируем...' : 'Начать анализ'}
        </button>

        {user?.subscriptionActive && (
          <button
            type="button"
            onClick={() => navigate('/analysis/hairstyle')}
            className="btn-light flex items-center justify-center gap-2"
          >
            <Scissors size={18} />
            Анализ причёски
          </button>
        )}
      </div>
    </div>
  );
}
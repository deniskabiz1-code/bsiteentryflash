import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
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
  const { user } = useApp();
  const { haptic } = useTelegram();

  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canAnalyze =
    user?.subscriptionActive ||
    (user?.faceAnalysisCount ?? 0) === 0 ||
    (user?.referralCredits ?? 0) > 0;

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

  return (
    <div className="page">
      <div className="page-inner space-y-6">
        <PageHeader />

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
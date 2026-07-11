import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProgressDots from '@/components/ProgressDots';
import PhotoUpload from '@/components/PhotoUpload';
import { analyzeHairstyle } from '@/api/client';
import { useTelegram } from '@/hooks/useTelegram';
import { HairstyleResult, FACE_SHAPE_LABELS } from '@/types';

export default function HairstyleAnalysis() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();

  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [sidePhoto, setSidePhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HairstyleResult | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  const handleAnalyze = async () => {
    if (!frontPhoto || !sidePhoto) return;
    setLoading(true);
    setError('');
    try {
      const data = await analyzeHairstyle(frontPhoto, sidePhoto);
      setResult(data.analysis);
      setStep(2);
      haptic('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Ошибка анализа');
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2 && result) {
    return (
      <div className="page">
        <div className="page-inner space-y-6">
          <section className="text-center pt-2">
            <p className="label-sm mb-2">Форма лица</p>
            <h1 className="heading-md">{FACE_SHAPE_LABELS[result.face_shape] || result.face_shape}</h1>
          </section>

          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Лучшие стрижки</h2>
            <div className="space-y-3">
              {result.best_haircuts?.map((cut, i) => (
                <div key={i} className="card">
                  <p className="font-semibold text-[15px]">{cut.name}</p>
                  <p className="text-[14px] text-app-muted mt-1 leading-relaxed">{cut.description}</p>
                </div>
              ))}
            </div>
          </section>

          {result.avoid?.length > 0 && (
            <section className="card">
              <h2 className="text-[15px] font-bold mb-3">Чего избегать</h2>
              {result.avoid.map((item, i) => (
                <p key={i} className="text-[14px] text-red-500 py-1">✕ {item}</p>
              ))}
            </section>
          )}

          <section className="card space-y-2">
            <p className="label-sm">Борода</p>
            <p className="font-semibold text-[15px]">
              {result.beard_recommendation?.recommended
                ? result.beard_recommendation.shape
                : 'Борода не рекомендуется'}
            </p>
          </section>

          <section className="card-green">
            <p className="label-sm mb-2">Бриф для барбера</p>
            <p className="text-[14px] leading-relaxed">{result.barber_brief}</p>
          </section>

          <section className="card border border-brand-green/20">
            <p className="text-[14px] text-app-muted">Примерка причёски скоро будет доступна</p>
          </section>

          <button type="button" onClick={() => navigate('/analysis')} className="btn-dark">
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page flex flex-col">
      <div className="page-inner flex-1 space-y-6">
        <ProgressDots total={2} current={step} />

        <section className="text-center">
          <p className="label-sm mb-2">{step === 0 ? 'Шаг 1 из 2' : 'Шаг 2 из 2'}</p>
          <h1 className="heading-md">{step === 0 ? 'Фото анфас' : 'Фото в профиль'}</h1>
        </section>

        {step === 0 ? (
          <PhotoUpload
            onPhotoSelect={(f) => { setFrontPhoto(f); setStep(1); }}
            label="Фото анфас"
            tips={['Смотрите прямо в камеру', 'Волосы не закрывают лицо']}
          />
        ) : (
          <>
            <PhotoUpload
              onPhotoSelect={setSidePhoto}
              label="Фото в профиль"
              tips={['Поверните голову на 90°', 'Видна линия челюсти']}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </>
        )}
      </div>

      {step === 1 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-app-canvas via-app-canvas to-transparent">
          <div className="max-w-md mx-auto">
            <button type="button" onClick={handleAnalyze} disabled={!sidePhoto || loading} className="btn-dark">
              {loading ? 'Анализируем...' : 'Получить рекомендации'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
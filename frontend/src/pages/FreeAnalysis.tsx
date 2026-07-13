import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Gift, Share2, Upload } from 'lucide-react';
import SegmentedControl from '@/components/SegmentedControl';
import TestCreditButton from '@/components/TestCreditButton';
import { getReferralInfo, submitReferralProof } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';

export default function FreeAnalysis() {
  const navigate = useNavigate();
  const { user, testCreditsEnabled } = useApp();
  const { haptic } = useTelegram();

  const [referral, setReferral] = useState<{ referralLink: string; referralCredits: number } | null>(null);
  const [referralTab, setReferralTab] = useState('Ссылка');

  useEffect(() => {
    getReferralInfo().then(setReferral).catch(() => {});
  }, []);

  const credits = referral?.referralCredits ?? user?.referralCredits ?? 0;

  const copyReferralLink = () => {
    if (referral?.referralLink) {
      navigator.clipboard.writeText(referral.referralLink);
      haptic('success');
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await submitReferralProof(file);
      haptic('success');
      alert('Скриншот отправлен на проверку. Обычно проверяем в течение суток.');
    } catch {
      haptic('error');
    }
  };

  return (
    <div className="page">
      <div className="page-inner space-y-6 pb-8">
        <header className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-app-surface shadow-pill"
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-[22px] font-bold leading-tight">Бесплатные анализы</h1>
            <p className="text-[14px] text-app-muted mt-0.5">
              Кредиты: <span className="font-bold text-brand-greenDark">{credits}</span>
            </p>
          </div>
        </header>

        <section className="card-green space-y-3">
          <div className="flex items-start gap-3">
            <Gift size={22} className="shrink-0 text-brand-greenDark mt-0.5" />
            <div className="space-y-1">
              <p className="text-[15px] font-bold text-brand-greenDark">Как это работает</p>
              <p className="text-[13px] leading-snug text-app-muted">
                1 кредит = 1 анализ лица. Получите кредиты через реферальную ссылку или TikTok-активность.
                После начисления откройте вкладку «Анализ» и загрузите селфи.
              </p>
            </div>
          </div>
        </section>

        {testCreditsEnabled && (
          <section className="card space-y-3">
            <h2 className="text-[17px] font-bold">Тестовый кредит</h2>
            <p className="text-[14px] text-app-muted">
              Для проверки AI-анализа — разовое начисление +1 кредита.
            </p>
            <TestCreditButton variant="accent" showCredits />
          </section>
        )}

        <section className="card space-y-4">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <Share2 size={18} />
            Реферальная программа
          </h2>
          <SegmentedControl
            options={['Ссылка', 'TikTok']}
            value={referralTab}
            onChange={setReferralTab}
          />
          {referralTab === 'Ссылка' ? (
            <>
              <p className="text-[14px] text-app-muted">
                Поделитесь ссылкой с другом — вы оба получите +1 анализ после его регистрации.
              </p>
              <button type="button" onClick={copyReferralLink} className="btn-light flex items-center justify-center gap-2">
                <Copy size={16} />
                Копировать ссылку
              </button>
            </>
          ) : (
            <>
              <p className="text-[14px] text-app-muted">
                Оставьте 5 комментариев под looksmax-видео в TikTok и загрузите скриншот.
                Мы проверим вручную и начислим +1 анализ.
              </p>
              <ul className="text-[13px] text-app-muted space-y-1 list-disc pl-5">
                <li>На скриншоте должны быть видны все 5 комментариев</li>
                <li>Один бонус за аккаунт после одобрения</li>
                <li>Решение придёт в Telegram от бота</li>
              </ul>
              <label className="btn-light flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={16} />
                Загрузить скриншот
                <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
              </label>
            </>
          )}
        </section>

        <section className="card space-y-2">
          <h2 className="text-[17px] font-bold">Подписка</h2>
          <p className="text-[14px] text-app-muted">
            400 ₽/мес — безлимитный анализ, причёска и персональный уход. Оформить можно во вкладке «Профиль».
          </p>
        </section>
      </div>
    </div>
  );
}
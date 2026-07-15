import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Gift, Share2 } from 'lucide-react';
import TestCreditButton from '@/components/TestCreditButton';
import { createPayment, getReferralInfo } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';

export default function FreeAnalysis() {
  const navigate = useNavigate();
  const { user, testCreditsEnabled } = useApp();
  const { haptic, openLink } = useTelegram();

  const [referral, setReferral] = useState<{ referralLink: string; referralCredits: number } | null>(null);

  useEffect(() => {
    getReferralInfo().then(setReferral).catch(() => {});
  }, []);

  const credits = referral?.referralCredits ?? user?.referralCredits ?? 0;

  const handleSubscribe = async () => {
    try {
      const data = await createPayment();
      openLink(data.paymentUrl);
    } catch {
      haptic('error');
    }
  };

  const copyReferralLink = () => {
    if (referral?.referralLink) {
      navigator.clipboard.writeText(referral.referralLink);
      haptic('success');
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
            <h1 className="text-[22px] font-bold leading-tight">Полные анализы</h1>
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
                Первый анализ бесплатно — только оценки и краткий обзор. 1 кредит = 1 полный разбор
                со всеми блоками. Получите кредиты, пригласив друга по ссылке.
              </p>
            </div>
          </div>
        </section>

        {testCreditsEnabled && (
          <section className="card space-y-3">
            <h2 className="text-[17px] font-bold">Тестовый кредит</h2>
            <p className="text-[14px] text-app-muted">
              Для проверки полного ИИ-анализа — разовое начисление +1 кредита.
            </p>
            <TestCreditButton variant="accent" showCredits />
          </section>
        )}

        <section className="card space-y-4">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <Share2 size={18} />
            Реферальная ссылка
          </h2>
          <p className="text-[14px] text-app-muted">
            Поделитесь ссылкой с другом — вы оба получите +1 полный анализ после его регистрации.
          </p>
          <button type="button" onClick={copyReferralLink} className="btn-light flex items-center justify-center gap-2">
            <Copy size={16} />
            Копировать ссылку
          </button>
        </section>

        <section className="card space-y-3">
          <h2 className="text-[17px] font-bold">Подписка</h2>
          <p className="text-[14px] text-app-muted">
            400 ₽/мес — безлимит полных анализов, причёска, динамика и персональная рутина ухода.
          </p>
          <button type="button" onClick={handleSubscribe} className="btn-dark">
            {user?.subscriptionActive ? 'Продлить подписку' : 'Оформить подписку'}
          </button>
        </section>
      </div>
    </div>
  );
}
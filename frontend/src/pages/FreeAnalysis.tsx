import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Crown, Share2 } from 'lucide-react';
import { createPayment, getReferralInfo } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';

export default function FreeAnalysis() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { haptic, openLink } = useTelegram();

  const [referral, setReferral] = useState<{
    referralLink: string;
    referralCredits: number;
  } | null>(null);

  useEffect(() => {
    getReferralInfo().then(setReferral).catch(() => {});
  }, []);

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
      <div className="page-inner page-animate space-y-6 pb-8">
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
            <h1 className="text-[22px] font-bold leading-tight">Полный анализ</h1>
            <p className="text-[14px] text-app-muted mt-0.5">
              Оценки бесплатно · разбор по подписке
            </p>
          </div>
        </header>

        <section className="card-green space-y-3">
          <div className="flex items-start gap-3">
            <Crown size={22} className="shrink-0 text-brand-greenDark mt-0.5" />
            <div className="space-y-1">
              <p className="text-[15px] font-bold text-brand-greenDark">Как это работает</p>
              <p className="text-[13px] leading-snug text-app-muted">
                Анализ лица всегда бесплатный. Оценки и краткий обзор без ограничений.
                Подписка открывает полный разбор: советы, стрижки, динамику и рутину ухода.
              </p>
            </div>
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="text-[17px] font-bold">Подписка</h2>
          <p className="text-[14px] text-app-muted">
            400 ₽/мес: безлимит полных анализов, причёска, динамика и персональная рутина ухода.
          </p>
          <button type="button" onClick={handleSubscribe} className="btn-dark">
            {user?.subscriptionActive ? 'Продлить подписку' : 'Оформить подписку'}
          </button>
        </section>

        <section className="card space-y-4">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <Share2 size={18} />
            Реферальная ссылка
          </h2>
          <p className="text-[14px] text-app-muted">
            Пригласите друга. Когда он оформит подписку, вы получите 1 полный анализ бесплатно.
          </p>
          {(referral?.referralCredits ?? user?.referralCredits ?? 0) > 0 && (
            <p className="text-[13px] font-semibold text-brand-greenDark">
              Доступно полных анализов: {referral?.referralCredits ?? user?.referralCredits}
            </p>
          )}
          <button type="button" onClick={copyReferralLink} className="btn-light flex items-center justify-center gap-2">
            <Copy size={16} />
            Копировать ссылку
          </button>
        </section>
      </div>
    </div>
  );
}
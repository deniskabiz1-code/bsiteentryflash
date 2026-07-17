import { useState } from 'react';
import { grantTestCredit } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';

type TestCreditButtonProps = {
  className?: string;
  variant?: 'light' | 'accent' | 'dark';
  showCredits?: boolean;
  label?: string;
  onGranted?: (credits: number) => void;
};

export default function TestCreditButton({
  className = '',
  variant = 'light',
  showCredits = false,
  label = 'Получить 1 полный анализ',
  onGranted,
}: TestCreditButtonProps) {
  const { user, refreshUser, applyUser } = useApp();
  const { haptic } = useTelegram();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const data = await grantTestCredit();
      if (data?.user) {
        applyUser(data.user);
      } else {
        await refreshUser();
      }
      const credits = data?.referralCredits ?? data?.user?.referralCredits;
      if (typeof credits === 'number') onGranted?.(credits);
      haptic('success');
    } catch (err: unknown) {
      haptic('error');
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg || 'Не удалось начислить кредит. Проверьте деплой бэкенда на Render.');
    } finally {
      setLoading(false);
    }
  };

  const btnClass =
    variant === 'accent' ? 'btn-accent' : variant === 'dark' ? 'btn-dark' : 'btn-light';
  const credits = user?.referralCredits ?? 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {showCredits && (
        <p className="text-[13px] text-app-muted">
          Полных анализов: <span className="font-bold text-brand-greenDark">{credits}</span>
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${btnClass} w-full text-[15px] font-semibold disabled:opacity-60`}
      >
        {loading ? 'Начисляем...' : label}
      </button>
    </div>
  );
}
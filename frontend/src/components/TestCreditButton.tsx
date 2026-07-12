import { useState } from 'react';
import { grantTestCredit } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';

type TestCreditButtonProps = {
  className?: string;
  variant?: 'light' | 'accent';
  showCredits?: boolean;
};

export default function TestCreditButton({
  className = '',
  variant = 'light',
  showCredits = false,
}: TestCreditButtonProps) {
  const { user, refreshUser } = useApp();
  const { haptic } = useTelegram();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await grantTestCredit();
      await refreshUser();
      haptic('success');
    } catch (err: unknown) {
      haptic('error');
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg || 'Не удалось начислить кредит. Проверьте деплой бэкенда на Render.');
    } finally {
      setLoading(false);
    }
  };

  const btnClass = variant === 'accent' ? 'btn-accent' : 'btn-light';
  const credits = user?.referralCredits ?? 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {showCredits && (
        <p className="text-[13px] text-app-muted">
          Кредиты анализа: <span className="font-bold text-brand-greenDark">{credits}</span>
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${btnClass} w-full text-[15px] font-semibold`}
      >
        {loading ? 'Начисляем...' : '+1 анализ (тест)'}
      </button>
    </div>
  );
}
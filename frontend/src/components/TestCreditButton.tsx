import { useState } from 'react';
import { grantTestCredit } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';

type TestCreditButtonProps = {
  className?: string;
  variant?: 'light' | 'accent';
};

export default function TestCreditButton({
  className = '',
  variant = 'light',
}: TestCreditButtonProps) {
  const { user, refreshUser } = useApp();
  const { haptic } = useTelegram();
  const [loading, setLoading] = useState(false);

  if (user?.subscriptionActive) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      await grantTestCredit();
      await refreshUser();
      haptic('success');
    } catch (err: unknown) {
      haptic('error');
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg || 'Не удалось начислить. На Render включите ENABLE_TEST_CREDITS=true');
    } finally {
      setLoading(false);
    }
  };

  const btnClass = variant === 'accent' ? 'btn-accent' : 'btn-light';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${btnClass} text-[14px] ${className}`}
    >
      {loading ? 'Начисляем...' : '+1 анализ (тест)'}
    </button>
  );
}
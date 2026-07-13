import TestCreditButton from '@/components/TestCreditButton';

export default function TestCreditCard() {
  return (
    <section className="card-green space-y-1">
      <p className="text-[15px] font-bold text-brand-greenDark">Тест ИИ-анализа</p>
      <p className="text-[13px] leading-snug text-app-muted">
        Нажмите, чтобы получить +1 кредит на анализ лица
      </p>
      <TestCreditButton variant="accent" showCredits />
    </section>
  );
}
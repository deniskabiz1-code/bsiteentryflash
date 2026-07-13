import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Gift, ImagePlus, Share2 } from 'lucide-react';
import SegmentedControl from '@/components/SegmentedControl';
import TestCreditButton from '@/components/TestCreditButton';
import { createPayment, getReferralInfo, submitReferralProof } from '@/api/client';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';

const TIKTOK_COMMENT_SCREENSHOTS = 5;
const TIKTOK_BOT_MENTION = '@primeform_app_bot';
const TIKTOK_COMMENT_EXAMPLES = [
  '@primeform_app_bot лучший бот для луксмаксинга',
];

export default function FreeAnalysis() {
  const navigate = useNavigate();
  const { user, testCreditsEnabled } = useApp();
  const { haptic, openLink } = useTelegram();

  const [referral, setReferral] = useState<{ referralLink: string; referralCredits: number } | null>(null);
  const [referralTab, setReferralTab] = useState('Ссылка');
  const [screenshots, setScreenshots] = useState<(File | null)[]>(
    () => Array(TIKTOK_COMMENT_SCREENSHOTS).fill(null),
  );
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>(
    () => Array(TIKTOK_COMMENT_SCREENSHOTS).fill(null),
  );
  const [proofSubmitting, setProofSubmitting] = useState(false);

  useEffect(() => {
    getReferralInfo().then(setReferral).catch(() => {});
  }, []);

  useEffect(() => () => {
    previewUrls.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
  }, [previewUrls]);

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

  const filledScreenshots = screenshots.filter(Boolean).length;
  const allScreenshotsReady = filledScreenshots === TIKTOK_COMMENT_SCREENSHOTS;

  const handleScreenshotPick = (index: number, file: File | null) => {
    setScreenshots((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    setPreviewUrls((prev) => {
      const next = [...prev];
      if (next[index]) URL.revokeObjectURL(next[index]!);
      next[index] = file ? URL.createObjectURL(file) : null;
      return next;
    });
  };

  const handleProofSubmit = async () => {
    if (!allScreenshotsReady || proofSubmitting) return;
    setProofSubmitting(true);
    try {
      await submitReferralProof(screenshots.filter(Boolean) as File[]);
      haptic('success');
      alert('5 скриншотов отправлены на проверку. Обычно проверяем в течение суток.');
      setScreenshots(Array(TIKTOK_COMMENT_SCREENSHOTS).fill(null));
      setPreviewUrls((prev) => {
        prev.forEach((url) => { if (url) URL.revokeObjectURL(url); });
        return Array(TIKTOK_COMMENT_SCREENSHOTS).fill(null);
      });
    } catch (err: unknown) {
      haptic('error');
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg || 'Не удалось отправить скриншоты');
    } finally {
      setProofSubmitting(false);
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
              Для проверки ИИ-анализа — разовое начисление +1 кредита.
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
              <div className="rounded-2xl bg-app-track/50 px-4 py-3 space-y-3">
                <p className="text-[14px] font-semibold">Как получить +1 анализ</p>
                <ol className="text-[13px] text-app-muted space-y-2 list-decimal pl-4">
                  <li>
                    Откройте TikTok и найдите видео через поиск. Подойдут запросы:
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {['looksmax', 'луксмакс', 'луксмаксинг'].map((term) => (
                        <span
                          key={term}
                          className="rounded-full bg-app-surface px-2.5 py-1 text-[12px] font-semibold text-app-text shadow-pill"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </li>
                  <li>
                    Оставьте 5 разных комментариев под видео в TikTok. В каждом комментарии
                    обязательно укажите <span className="font-semibold text-app-text">{TIKTOK_BOT_MENTION}</span>.
                  </li>
                  <li>Сделайте скриншот каждого комментария — на нём должен быть виден текст с {TIKTOK_BOT_MENTION}.</li>
                  <li>Загрузите все 5 скриншотов ниже и отправьте на проверку.</li>
                </ol>
              </div>
              <div className="space-y-2">
                <p className="text-[13px] font-semibold">Примеры комментариев</p>
                <ul className="space-y-2">
                  {TIKTOK_COMMENT_EXAMPLES.map((example) => (
                    <li
                      key={example}
                      className="rounded-xl bg-app-track/40 px-3 py-2 text-[12px] leading-snug text-app-muted"
                    >
                      «{example}»
                    </li>
                  ))}
                </ul>
                <p className="text-[12px] text-app-muted">
                  Не копируйте один в один — напишите своими словами, но {TIKTOK_BOT_MENTION} должен быть в каждом из 5 комментариев.
                </p>
              </div>
              <ul className="text-[13px] text-app-muted space-y-1 list-disc pl-5">
                <li>Один бонус за аккаунт после одобрения</li>
                <li>Решение придёт в Telegram от бота</li>
                <li>Проверка обычно в течение суток</li>
              </ul>
              <div className="space-y-3">
                <p className="text-[13px] font-semibold text-app-muted">
                  Скриншоты: {filledScreenshots}/{TIKTOK_COMMENT_SCREENSHOTS}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {screenshots.map((_, index) => (
                    <label
                      key={index}
                      className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-app-border bg-app-track/40 p-2 text-center overflow-hidden"
                    >
                      {previewUrls[index] ? (
                        <img
                          src={previewUrls[index]!}
                          alt={`Комментарий ${index + 1}`}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <ImagePlus size={20} className="text-app-muted" />
                          <span className="text-[11px] font-semibold text-app-muted">
                            Коммент. {index + 1}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleScreenshotPick(index, e.target.files?.[0] || null);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleProofSubmit}
                  disabled={!allScreenshotsReady || proofSubmitting}
                  className="btn-accent disabled:opacity-50"
                >
                  {proofSubmitting
                    ? 'Отправляем...'
                    : `Отправить ${TIKTOK_COMMENT_SCREENSHOTS} скриншотов`}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="card space-y-3">
          <h2 className="text-[17px] font-bold">Подписка</h2>
          <p className="text-[14px] text-app-muted">
            400 ₽/мес — безлимитный анализ, причёска и персональная рутина ухода.
          </p>
          <button type="button" onClick={handleSubscribe} className="btn-dark">
            {user?.subscriptionActive ? 'Продлить подписку' : 'Оформить подписку'}
          </button>
        </section>
      </div>
    </div>
  );
}
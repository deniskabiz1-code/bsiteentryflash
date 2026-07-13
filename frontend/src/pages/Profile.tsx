import { useState, useEffect } from 'react';
import { Bell, Share2, Copy, Trash2, Upload } from 'lucide-react';
import Modal from '@/components/Modal';
import SegmentedControl from '@/components/SegmentedControl';
import {
  createPayment, getReferralInfo, submitReferralProof,
  updateProfile, updateReminders, getSkincareRoutine,
  getLastCheckin, deleteAccount,
} from '@/api/client';
import TestCreditCard from '@/components/TestCreditCard';
import { useApp } from '@/context/AppContext';
import { useTelegram } from '@/hooks/useTelegram';
import { useTelegramPhoto } from '@/hooks/useTelegramPhoto';
import AgeSlider from '@/components/AgeSlider';
import GoalSelector from '@/components/GoalSelector';
import UserAvatar from '@/components/UserAvatar';
import { GOAL_LABELS } from '@/types';
import { assetUrl } from '@/utils/assets';

export default function Profile() {
  const { user, refreshUser } = useApp();
  const { openLink, haptic } = useTelegram();
  const photoUrl = useTelegramPhoto();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(String(user?.age || ''));
  const [goals, setGoals] = useState<string[]>(user?.goals || []);
  const [referral, setReferral] = useState<{ referralLink: string; referralCredits: number } | null>(null);
  const [skincare, setSkincare] = useState<{ step: string; product_type: string; tip: string }[]>([]);
  const [lastCheckin, setLastCheckin] = useState<{ photoUrl: string; overallScore: number; createdAt: string } | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(user?.reminderEnabled || false);
  const [reminderTime, setReminderTime] = useState(user?.reminderTime || '09:00');
  const [showDelete, setShowDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [referralTab, setReferralTab] = useState('Ссылка');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (user?.subscriptionActive) {
      getSkincareRoutine().then((d) => setSkincare(d.routine || [])).catch(() => {});
    }
    getLastCheckin().then((d) => setLastCheckin(d.checkin)).catch(() => {});
    getReferralInfo().then(setReferral).catch(() => {});
  }, [user]);

  const handleSubscribe = async () => {
    try {
      const data = await createPayment();
      openLink(data.paymentUrl);
    } catch {
      haptic('error');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({ name, age: parseInt(age, 10), goals });
      await refreshUser();
      setEditing(false);
      haptic('success');
    } catch {
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReminderToggle = async () => {
    const newVal = !reminderEnabled;
    setReminderEnabled(newVal);
    await updateReminders(newVal, reminderTime);
    haptic('light');
  };

  const handleReminderTime = async (time: string) => {
    setReminderTime(time);
    if (reminderEnabled) await updateReminders(true, time);
  };

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
      alert('Скриншот отправлен на проверку');
    } catch {
      haptic('error');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      setShowDelete(false);
      setShowDeleteConfirm(false);
      await refreshUser();
      haptic('success');
    } catch {
      setDeleteError('Не удалось удалить аккаунт. Попробуйте снова.');
      haptic('error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const fallbackLetter = user?.name || 'P';

  return (
    <div className="page">
      <div className="page-inner space-y-6">
        <TestCreditCard />

        <section className="text-center pt-2">
          <UserAvatar
            photoUrl={photoUrl}
            fallbackLetter={fallbackLetter}
            size="md"
            className="mx-auto mb-4"
          />
          <span className="pill-gray">@{user?.username || 'user'}</span>
          <h1 className="heading-md mt-4">{user?.name || 'Профиль'}</h1>
          <p className="text-[15px] text-app-muted mt-1">Настройки и подписка</p>
        </section>

        {lastCheckin && (
          <section className="card-green flex items-center gap-4">
            <img src={assetUrl(lastCheckin.photoUrl)} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            <div className="flex-1">
              <p className="label-sm">Последний чек-ин</p>
              <p className="text-[28px] font-bold leading-none mt-1">{lastCheckin.overallScore}<span className="text-app-muted text-base">/100</span></p>
              <p className="text-[13px] text-app-muted mt-1">
                {new Date(lastCheckin.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </section>
        )}

        {user?.subscriptionActive && skincare.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold mb-3 px-1">Мой уход за кожей</h2>
            <div className="card !p-0 overflow-hidden">
              {skincare.map((item, i) => (
                <div key={i} className="px-5 py-4 border-b border-app-border last:border-0">
                  <p className="font-semibold text-[15px]">{item.step}</p>
                  <p className="text-[14px] text-app-muted mt-1">{item.product_type}</p>
                  <p className="text-[13px] text-app-faint mt-1">{item.tip}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold">Подписка</h2>
            <span className={`pill-green ${!user?.subscriptionActive ? '!bg-app-track !text-app-muted' : ''}`}>
              {user?.subscriptionActive ? 'Активна' : 'Неактивна'}
            </span>
          </div>
          {user?.subscriptionActive && user.subscriptionEnd && (
            <p className="text-[14px] text-app-muted">
              До {new Date(user.subscriptionEnd).toLocaleDateString('ru-RU')}
            </p>
          )}
          <p className="text-[14px] text-app-muted">400 ₽/мес — безлимитный анализ, причёска, уход</p>
          <button type="button" onClick={handleSubscribe} className="btn-dark">
            {user?.subscriptionActive ? 'Продлить подписку' : 'Оформить подписку'}
          </button>
        </section>

        <section className="card space-y-4">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <Share2 size={18} />
            Реферальная программа
          </h2>
          <p className="text-[14px] text-app-muted">
            Кредиты: <span className="font-bold text-brand-greenDark">{referral?.referralCredits ?? user?.referralCredits ?? 0}</span>
          </p>
          <SegmentedControl
            options={['Ссылка', 'TikTok']}
            value={referralTab}
            onChange={setReferralTab}
          />
          {referralTab === 'Ссылка' ? (
            <>
              <p className="text-[14px] text-app-muted">Поделитесь ссылкой — вы оба получите +1 анализ</p>
              <button type="button" onClick={copyReferralLink} className="btn-light flex items-center justify-center gap-2">
                <Copy size={16} />
                Копировать ссылку
              </button>
            </>
          ) : (
            <>
              <p className="text-[14px] text-app-muted">5 комментариев под looksmax-видео + скриншот</p>
              <label className="btn-light flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={16} />
                Загрузить скриншот
                <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
              </label>
            </>
          )}
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold">Данные профиля</h2>
            <button
              type="button"
              onClick={() => editing ? handleSaveProfile() : setEditing(true)}
              className="text-[14px] font-semibold text-app-text underline"
            >
              {editing ? (loading ? '...' : 'Сохранить') : 'Изменить'}
            </button>
          </div>
          {editing ? (
            <div className="space-y-5">
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" />
              <AgeSlider
                value={parseInt(age, 10) || 14}
                onChange={(v) => setAge(String(v))}
              />
              <GoalSelector selected={goals} onToggle={toggleGoal} />
            </div>
          ) : (
            <div className="space-y-0">
              <div className="list-row"><span className="text-app-muted">Имя</span><span className="font-semibold">{user?.name || '—'}</span></div>
              <div className="list-row"><span className="text-app-muted">Возраст</span><span className="font-semibold">{user?.age || '—'}</span></div>
              <div className="list-row"><span className="text-app-muted">Цели</span><span className="font-semibold">{user?.goals?.map((g) => GOAL_LABELS[g]).join(', ') || '—'}</span></div>
            </div>
          )}
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold flex items-center gap-2"><Bell size={18} /> Напоминания</h2>
            <button
              type="button"
              onClick={handleReminderToggle}
              className={`w-12 h-7 rounded-full transition-colors relative ${reminderEnabled ? 'bg-brand-green' : 'bg-app-border'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-pill transition-transform ${reminderEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {reminderEnabled && (
            <input type="time" value={reminderTime} onChange={(e) => handleReminderTime(e.target.value)} className="input-field" />
          )}
        </section>

        <section className="card space-y-0">
          <div className="list-row"><span className="text-app-muted">Telegram</span><span className="font-semibold">@{user?.username || '—'}</span></div>
          <div className="list-row"><span className="text-app-muted">ID</span><span className="font-semibold">{user?.telegramId}</span></div>
        </section>

        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="w-full py-3 text-red-500 text-[14px] font-semibold flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          Удалить аккаунт
        </button>
      </div>

      <Modal
        open={showDelete}
        onClose={() => {
          if (deleting) return;
          setShowDelete(false);
          setShowDeleteConfirm(false);
          setDeleteError('');
        }}
      >
        <div className="space-y-4">
          {!showDeleteConfirm ? (
            <>
              <p className="font-bold text-center text-[17px]">Удалить аккаунт?</p>
              <p className="text-[14px] text-app-muted text-center">Все данные будут удалены безвозвратно</p>
              <div className="btn-row">
                <button type="button" onClick={() => setShowDelete(false)} className="btn-light flex-1">Отмена</button>
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex-1 py-4 rounded-full bg-red-500 text-white font-semibold">Удалить</button>
              </div>
            </>
          ) : (
            <>
              <p className="font-bold text-center text-red-500 text-[17px]">Вы уверены?</p>
              {deleteError && <p className="text-red-500 text-sm text-center">{deleteError}</p>}
              <div className="btn-row">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => { setShowDelete(false); setShowDeleteConfirm(false); setDeleteError(''); }}
                  className="btn-light flex-1"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteAccount}
                  className="flex-1 py-4 rounded-full bg-red-600 text-white font-semibold disabled:opacity-50"
                >
                  {deleting ? 'Удаляем...' : 'Да, удалить'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
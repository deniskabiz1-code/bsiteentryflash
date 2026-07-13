import { enrichSkincareRoutine } from '@/data/wildberriesSkincare';
import {
  MOCK_USER,
  MOCK_FACE_RESULT,
  MOCK_ANALYSES,
  MOCK_DAILY_TASKS,
} from './mockData';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let analyses = [...MOCK_ANALYSES];
let user = { ...MOCK_USER };
let tasks = structuredClone(MOCK_DAILY_TASKS);

export const mockApi = {
  fetchMe: async () => {
    await delay(300);
    return { user, channelSubscribed: true, testCreditsEnabled: true };
  },

  grantTestCredit: async () => {
    await delay(200);
    user = { ...user, referralCredits: (user.referralCredits ?? 0) + 1 };
    return { user, referralCredits: user.referralCredits };
  },

  checkChannel: async () => {
    await delay(200);
    return { subscribed: true, error: undefined, hint: undefined };
  },

  completeOnboarding: async (payload: { name: string; age: number; goals: string[] }) => {
    await delay(500);
    user = { ...user, ...payload, onboarded: true, faceAnalysisCount: 0, freeAnalysisAvailable: true };
    return { user };
  },

  analyzeFace: async (_photo: File) => {
    await delay(1500);
    const analysis = {
      id: analyses.length + 1,
      ...MOCK_FACE_RESULT,
      photoUrl: MOCK_ANALYSES[0].photoUrl,
    };
    return { analysis };
  },

  analyzeHairstyle: async (_front: File, _side: File) => {
    await delay(1500);
    return {
      analysis: {
        face_shape: 'oval',
        best_haircuts: [
          { name: 'Текстурированный кроп', description: 'Подчёркивает скулы и линию челюсти' },
          { name: 'Фейд с чёлкой', description: 'Смягчает овальную форму лица' },
          { name: 'Сайд-парт', description: 'Классический вариант для офиса' },
        ],
        avoid: ['Длинные волосы без объёма', 'Прямая чёлка до бровей'],
        beard_recommendation: { recommended: true, shape: 'Короткая щетина с акцентом на линию челюсти' },
        barber_brief: 'Овальное лицо. Нужен текстурированный кроп с умеренным фейдом, объём сверху, короткие виски.',
      },
    };
  },

  getAnalysisHistory: async () => {
    await delay(300);
    return { analyses };
  },

  getAnalysis: async (id: number) => {
    await delay(200);
    const analysis = analyses.find((a) => a.id === id);
    if (!analysis) throw new Error('Анализ не найден');
    return { analysis };
  },

  deleteAnalysis: async (id: number) => {
    await delay(300);
    analyses = analyses.filter((a) => a.id !== id);
    return { success: true };
  },

  getDailyTasks: async () => {
    await delay(300);
    return tasks;
  },

  toggleTask: async (taskKey: string) => {
    await delay(150);
    let completed = false;
    tasks = {
      ...tasks,
      tasks: tasks.tasks.map((group) => ({
        ...group,
        tasks: group.tasks.map((t) => {
          if (t.key === taskKey) {
            completed = !t.completed;
            return { ...t, completed };
          }
          return t;
        }),
      })),
    };
    return { completed };
  },

  getSubscriptionStatus: async () => ({
    active: user.subscriptionActive,
    subscriptionEnd: user.subscriptionEnd,
    price: 400,
  }),

  createPayment: async () => ({
    paymentUrl: 'https://auth.robokassa.ru/Merchant/Index.aspx?mock=true',
  }),

  getReferralInfo: async () => ({
    referralCode: user.referralCode,
    referralCredits: user.referralCredits,
    referralLink: `https://t.me/primeform_bot?start=ref_${user.referralCode}`,
  }),

  applyReferralCode: async (_code: string) => ({ success: true, credits: 1 }),

  submitReferralProof: async (files: File[]) => ({
    success: true,
    proofId: 1,
    message: `Скриншоты отправлены на проверку (${files.length})`,
  }),

  updateProfile: async (payload: { name?: string; age?: number; goals?: string[] }) => {
    user = { ...user, ...payload };
    return { user };
  },

  updateReminders: async (enabled: boolean, time?: string, timezone?: string) => {
    user = {
      ...user,
      reminderEnabled: enabled,
      reminderTime: time || user.reminderTime,
      reminderTimezone: timezone || user.reminderTimezone,
    };
    return {
      reminderEnabled: enabled,
      reminderTime: time || user.reminderTime,
      reminderTimezone: timezone || user.reminderTimezone,
    };
  },

  getSkincareRoutine: async () => ({
    routine: enrichSkincareRoutine(MOCK_FACE_RESULT.skincare_routine),
  }),

  getLastCheckin: async () => ({
    checkin: analyses[0] || null,
  }),

  deleteAccount: async () => ({ success: true }),
};
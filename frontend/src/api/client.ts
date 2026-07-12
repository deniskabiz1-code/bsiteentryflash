import axios from 'axios';
import { getTgWebApp } from '@/lib/tgWebApp';
import { mockApi } from './mock';

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true';
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
});

if (!MOCK) {
  api.interceptors.request.use((config) => {
    const initData = getTgWebApp()?.initData;
    if (initData) {
      config.headers['X-Telegram-Init-Data'] = initData;
    }
    return config;
  });
}

export async function fetchProfilePhoto(): Promise<Blob | null> {
  if (MOCK) return null;
  try {
    const { data } = await api.get('/auth/profile-photo', {
      responseType: 'blob',
      timeout: 15000,
    });
    if (data instanceof Blob && data.size > 0) return data;
    return null;
  } catch {
    return null;
  }
}

export async function fetchMe() {
  if (MOCK) return mockApi.fetchMe();
  const { data } = await api.post('/auth/me', undefined, { timeout: 35000 });
  return data;
}

export async function checkChannel() {
  if (MOCK) return mockApi.checkChannel();
  const { data } = await api.get('/auth/channel-check');
  return data;
}

export async function getChannelInfo() {
  if (MOCK) return { link: 'https://t.me/primeform_channel', username: 'primeform_channel' };
  const { data } = await api.get('/auth/channel-info');
  return data;
}

export async function completeOnboarding(payload: {
  name: string;
  age: number;
  goals: string[];
}) {
  if (MOCK) return mockApi.completeOnboarding(payload);
  const { data } = await api.post('/onboarding/complete', payload, { timeout: 30000 });
  return data;
}

export async function analyzeFace(photo: File) {
  if (MOCK) return mockApi.analyzeFace(photo);
  const form = new FormData();
  form.append('photo', photo);
  const { data } = await api.post('/analysis/face', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function analyzeHairstyle(front: File, side: File) {
  if (MOCK) return mockApi.analyzeHairstyle(front, side);
  const form = new FormData();
  form.append('frontPhoto', front);
  form.append('sidePhoto', side);
  const { data } = await api.post('/analysis/hairstyle', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getAnalysisHistory() {
  if (MOCK) return mockApi.getAnalysisHistory();
  const { data } = await api.get('/analysis/history');
  return data;
}

export async function getAnalysis(id: number) {
  if (MOCK) return mockApi.getAnalysis(id);
  const { data } = await api.get(`/analysis/${id}`);
  return data;
}

export async function deleteAnalysis(id: number) {
  if (MOCK) return mockApi.deleteAnalysis(id);
  const { data } = await api.delete(`/analysis/${id}`);
  return data;
}

export async function getDailyTasks() {
  if (MOCK) return mockApi.getDailyTasks();
  const { data } = await api.get('/tasks/daily');
  return data;
}

export async function toggleTask(taskKey: string) {
  if (MOCK) return mockApi.toggleTask(taskKey);
  const { data } = await api.post('/tasks/toggle', { taskKey });
  return data;
}

export async function getSubscriptionStatus() {
  if (MOCK) return mockApi.getSubscriptionStatus();
  const { data } = await api.get('/subscription/status');
  return data;
}

export async function createPayment() {
  if (MOCK) return mockApi.createPayment();
  const { data } = await api.post('/subscription/create-payment');
  return data;
}

export async function getReferralInfo() {
  if (MOCK) return mockApi.getReferralInfo();
  const { data } = await api.get('/referral/info');
  return data;
}

export async function applyReferralCode(code: string) {
  if (MOCK) return mockApi.applyReferralCode(code);
  const { data } = await api.post('/referral/apply', { referralCode: code });
  return data;
}

export async function submitReferralProof(file: File) {
  if (MOCK) return mockApi.submitReferralProof(file);
  const form = new FormData();
  form.append('screenshot', file);
  const { data } = await api.post('/referral/proof', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateProfile(payload: {
  name?: string;
  age?: number;
  goals?: string[];
}) {
  if (MOCK) return mockApi.updateProfile(payload);
  const { data } = await api.put('/user/profile', payload);
  return data;
}

export async function updateReminders(enabled: boolean, time?: string) {
  if (MOCK) return mockApi.updateReminders(enabled, time);
  const { data } = await api.put('/user/reminders', { enabled, time });
  return data;
}

export async function getSkincareRoutine() {
  if (MOCK) return mockApi.getSkincareRoutine();
  const { data } = await api.get('/user/skincare');
  return data;
}

export async function getLastCheckin() {
  if (MOCK) return mockApi.getLastCheckin();
  const { data } = await api.get('/user/last-checkin');
  return data;
}

export async function deleteAccount() {
  if (MOCK) return mockApi.deleteAccount();
  const { data } = await api.post('/user/account/delete', { confirm: 'DELETE' });
  return data;
}

export async function grantTestCredit() {
  if (MOCK) return mockApi.grantTestCredit();
  const { data } = await api.post('/user/test-credit');
  return data;
}

export default api;
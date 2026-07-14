import { prisma } from '../utils/prisma';
import { TelegramUser } from '../middleware/validateTelegramAuth';

const BOT_API = 'https://api.telegram.org/bot';
const DEFAULT_CHANNEL_USERNAME = 'primeformnews';

export interface ChannelCheckResult {
  subscribed: boolean;
  error?: string;
  hint?: string;
}

export function getChannelLink(): string {
  return getChannelOpenUrl();
}

/** URL safe for Telegram WebApp.openTelegramLink (must be https://t.me/...) */
export function getChannelOpenUrl(): string {
  const invite = process.env.CHANNEL_INVITE_LINK?.trim();
  if (invite) {
    if (invite.startsWith('https://t.me/') || invite.startsWith('http://t.me/')) {
      return invite.replace('http://', 'https://');
    }
    if (invite.startsWith('t.me/')) {
      return `https://${invite}`;
    }
  }
  const username = normalizeUsername(process.env.CHANNEL_USERNAME || DEFAULT_CHANNEL_USERNAME);
  return `https://t.me/${username}`;
}

function normalizeUsername(username: string): string {
  return username.replace(/^@/, '');
}

function getChannelChatId(): string {
  if (process.env.CHANNEL_ID) {
    return process.env.CHANNEL_ID;
  }
  return `@${normalizeUsername(process.env.CHANNEL_USERNAME || DEFAULT_CHANNEL_USERNAME)}`;
}

export async function checkChannelSubscription(telegramId: number): Promise<ChannelCheckResult> {
  const botToken = process.env.BOT_TOKEN;
  const chatId = getChannelChatId();

  if (!botToken) {
    return {
      subscribed: false,
      error: 'BOT_TOKEN не настроен на сервере',
    };
  }

  try {
    const res = await fetch(
      `${BOT_API}${botToken}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${telegramId}`
    );
    const data = (await res.json()) as {
      ok: boolean;
      description?: string;
      error_code?: number;
      result?: { status: string };
    };

    if (!data.ok) {
      console.error('getChatMember failed:', data.description, { chatId, telegramId });
      return {
        subscribed: false,
        error: data.description || 'Ошибка проверки подписки',
        hint: getChannelCheckHint(data.description),
      };
    }

    const status = data.result?.status;
    const subscribed = ['creator', 'administrator', 'member'].includes(status || '');

    return {
      subscribed,
      error: subscribed ? undefined : 'Вы не подписаны на канал',
    };
  } catch (err) {
    console.error('checkChannelSubscription error:', err);
    return {
      subscribed: false,
      error: 'Сервер не смог связаться с Telegram',
    };
  }
}

function getChannelCheckHint(apiError?: string): string {
  if (!apiError) return 'Добавьте бота администратором в канал';
  if (apiError.includes('chat not found')) {
    return 'Канал не найден. Проверьте CHANNEL_USERNAME или CHANNEL_ID на Render';
  }
  if (apiError.includes('member list is inaccessible')) {
    return 'Добавьте бота администратором канала (обязательно!)';
  }
  if (apiError.includes('user not found')) {
    return 'Не удалось найти ваш Telegram-аккаунт';
  }
  return 'Добавьте бота администратором в канал';
}

export type BotMessageOptions = {
  /** Inline Mini App button (opens inside Telegram, not browser). Default: true when APP_URL is set. */
  appButton?: boolean;
  buttonText?: string;
};

/** HTTPS URL configured in BotFather as the Mini App / menu button. */
export function getMiniAppUrl(): string | null {
  const url = (process.env.APP_URL || process.env.FRONTEND_URL || '').trim();
  return url || null;
}

export async function sendBotMessage(
  telegramId: number,
  text: string,
  options: BotMessageOptions = {},
): Promise<void> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return;

  const appUrl = getMiniAppUrl();
  const useAppButton = options.appButton ?? Boolean(appUrl);
  const payload: Record<string, unknown> = {
    chat_id: telegramId,
    text,
    parse_mode: 'HTML',
  };

  if (useAppButton && appUrl) {
    payload.reply_markup = {
      inline_keyboard: [[{
        text: options.buttonText || 'Открыть Primeform',
        web_app: { url: appUrl },
      }]],
    };
  }

  try {
    await fetch(`${BOT_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Failed to send bot message:', err);
  }
}

type PhotoPayload = {
  buffer: Uint8Array;
  filename: string;
};

function isAdminAnalysisNotifyEnabled(): boolean {
  if (process.env.ADMIN_NOTIFY_ANALYSES === 'false') return false;
  return Boolean(process.env.ADMIN_TELEGRAM_ID?.trim());
}

export async function sendBotPhotoBuffer(
  chatId: string | number,
  photo: PhotoPayload,
  caption?: string,
): Promise<void> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return;

  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('photo', new Blob([photo.buffer]), photo.filename);
  if (caption) {
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
  }

  try {
    const res = await fetch(`${BOT_API}${botToken}/sendPhoto`, {
      method: 'POST',
      body: form,
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      console.error('sendBotPhotoBuffer failed:', data.description);
    }
  } catch (err) {
    console.error('Failed to send bot photo buffer:', err);
  }
}

export async function sendBotMediaGroupBuffers(
  chatId: string | number,
  photos: PhotoPayload[],
  caption?: string,
): Promise<void> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken || photos.length === 0) return;

  const form = new FormData();
  form.append('chat_id', String(chatId));

  const media = photos.map((photo, index) => {
    const attachName = `file${index}`;
    form.append(attachName, new Blob([photo.buffer]), photo.filename);
    return {
      type: 'photo',
      media: `attach://${attachName}`,
      ...(index === 0 && caption
        ? { caption, parse_mode: 'HTML' }
        : {}),
    };
  });

  form.append('media', JSON.stringify(media));

  try {
    const res = await fetch(`${BOT_API}${botToken}/sendMediaGroup`, {
      method: 'POST',
      body: form,
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      console.error('sendBotMediaGroupBuffers failed:', data.description);
    }
  } catch (err) {
    console.error('Failed to send bot media group buffers:', err);
  }
}

export async function sendBotPhoto(
  telegramId: number,
  photoUrl: string,
  caption?: string,
): Promise<void> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(`${BOT_API}${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        photo: photoUrl,
        caption,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Failed to send bot photo:', err);
  }
}

export function getPublicApiBaseUrl(): string {
  const explicit = process.env.API_PUBLIC_URL?.trim()
    || process.env.RENDER_EXTERNAL_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const port = process.env.PORT || '3001';
  return `http://localhost:${port}`;
}

export async function sendBotMediaGroup(
  telegramId: number,
  photoUrls: string[],
  caption?: string,
): Promise<void> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken || photoUrls.length === 0) return;

  const media = photoUrls.map((url, index) => ({
    type: 'photo',
    media: url,
    ...(index === 0 && caption
      ? { caption, parse_mode: 'HTML' }
      : {}),
  }));

  try {
    await fetch(`${BOT_API}${botToken}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        media,
      }),
    });
  } catch (err) {
    console.error('Failed to send bot media group:', err);
  }
}

export async function notifyAdminAnalysisSubmission(payload: {
  type: 'face' | 'hairstyle' | 'try-on';
  analysisId?: number;
  username: string | null;
  telegramId: bigint;
  name?: string | null;
  age?: number | null;
  overallScore?: number | null;
  hairstyleName?: string;
  photos: PhotoPayload[];
}): Promise<void> {
  if (!isAdminAnalysisNotifyEnabled()) return;

  const adminId = process.env.ADMIN_TELEGRAM_ID!.trim();
  const userLabel = payload.username ? `@${payload.username}` : `ID ${payload.telegramId}`;
  const profileBits = [
    payload.name?.trim(),
    payload.age ? `${payload.age} лет` : null,
  ].filter(Boolean);

  const typeLabels = {
    face: '🪞 <b>Новый анализ лица</b>',
    hairstyle: '💇 <b>Новый анализ причёски</b>',
    'try-on': '✂️ <b>Примерка причёски</b>',
  } as const;

  const captionLines = [
    typeLabels[payload.type],
    '',
    `Пользователь: ${userLabel}`,
  ];

  if (profileBits.length > 0) {
    captionLines.push(`Профиль: ${profileBits.join(', ')}`);
  }
  if (payload.overallScore != null) {
    captionLines.push(`Балл: <b>${payload.overallScore}/100</b>`);
  }
  if (payload.hairstyleName) {
    captionLines.push(`Стиль: ${payload.hairstyleName}`);
  }
  if (payload.analysisId != null) {
    captionLines.push(`Анализ #${payload.analysisId}`);
  }

  const caption = captionLines.join('\n');
  const photos = payload.photos.filter((photo) => photo.buffer.length > 0);
  if (photos.length === 0) return;

  if (photos.length === 1) {
    await sendBotPhotoBuffer(adminId, photos[0], caption);
    return;
  }

  await sendBotMediaGroupBuffers(adminId, photos, caption);
}

export async function notifyAdminReferralProof(proof: {
  id: number;
  imageUrls: string[];
  username: string | null;
  telegramId: bigint;
}): Promise<void> {
  const adminId = process.env.ADMIN_TELEGRAM_ID?.trim();
  if (!adminId) return;

  const baseUrl = getPublicApiBaseUrl();
  const imageFullUrls = proof.imageUrls.map((url) => `${baseUrl}${url}`);
  const userLabel = proof.username ? `@${proof.username}` : `ID ${proof.telegramId}`;
  const caption = [
    '📸 <b>Новая заявка TikTok</b>',
    '',
    `Пользователь: ${userLabel}`,
    `Заявка #${proof.id} · ${proof.imageUrls.length} скриншотов`,
    '',
    'Одобрить:',
    `<code>node backend/scripts/referral-admin.mjs approve ${proof.id}</code>`,
    '',
    'Отклонить:',
    `<code>node backend/scripts/referral-admin.mjs reject ${proof.id}</code>`,
  ].join('\n');

  if (imageFullUrls.length === 1) {
    await sendBotPhoto(Number(adminId), imageFullUrls[0], caption);
    return;
  }

  await sendBotMediaGroup(Number(adminId), imageFullUrls, caption);
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function findOrCreateUser(telegramUser: TelegramUser) {
  const telegramId = BigInt(telegramUser.id);

  const existing = await prisma.user.findUnique({ where: { telegramId } });
  if (existing) {
    if (telegramUser.username && existing.username !== telegramUser.username) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { username: telegramUser.username },
      });
    }
    return existing;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const referralCode = generateReferralCode();
    try {
      return await prisma.user.create({
        data: {
          telegramId,
          username: telegramUser.username || null,
          referralCode,
        },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        const raced = await prisma.user.findUnique({ where: { telegramId } });
        if (raced) return raced;
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to create user');
}

export function isSubscriptionActive(subscriptionEnd: Date | null): boolean {
  if (!subscriptionEnd) return false;
  return subscriptionEnd > new Date();
}

export async function getUserProfilePhotoFilePath(telegramId: number): Promise<string | null> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return null;

  try {
    const photosRes = await fetch(
      `${BOT_API}${botToken}/getUserProfilePhotos?user_id=${telegramId}&limit=1`
    );
    const photosData = (await photosRes.json()) as {
      ok: boolean;
      result?: { photos?: { file_id: string }[][] };
    };

    if (!photosData.ok || !photosData.result?.photos?.length) {
      return null;
    }

    const sizes = photosData.result.photos[0];
    const fileId = sizes[sizes.length - 1]?.file_id;
    if (!fileId) return null;

    const fileRes = await fetch(`${BOT_API}${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const fileData = (await fileRes.json()) as {
      ok: boolean;
      result?: { file_path: string };
    };

    if (!fileData.ok || !fileData.result?.file_path) {
      return null;
    }

    return fileData.result.file_path;
  } catch (err) {
    console.error('getUserProfilePhotoFilePath error:', err);
    return null;
  }
}
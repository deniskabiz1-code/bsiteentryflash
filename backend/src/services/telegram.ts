import { prisma } from '../utils/prisma';
import { TelegramUser } from '../middleware/validateTelegramAuth';

const BOT_API = 'https://api.telegram.org/bot';

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
  const username = normalizeUsername(process.env.CHANNEL_USERNAME || 'primeform_channel');
  return `https://t.me/${username}`;
}

function normalizeUsername(username: string): string {
  return username.replace(/^@/, '');
}

function getChannelChatId(): string {
  if (process.env.CHANNEL_ID) {
    return process.env.CHANNEL_ID;
  }
  return `@${normalizeUsername(process.env.CHANNEL_USERNAME || 'primeform_channel')}`;
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

export async function sendBotMessage(telegramId: number, text: string): Promise<void> {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(`${BOT_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Failed to send bot message:', err);
  }
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
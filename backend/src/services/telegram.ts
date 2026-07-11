import { prisma } from '../utils/prisma';
import { TelegramUser } from '../middleware/validateTelegramAuth';

const BOT_API = 'https://api.telegram.org/bot';

export interface ChannelCheckResult {
  subscribed: boolean;
  error?: string;
  hint?: string;
}

export function getChannelLink(): string {
  if (process.env.CHANNEL_INVITE_LINK) {
    return process.env.CHANNEL_INVITE_LINK;
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

  let user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user) {
    let referralCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.user.findUnique({ where: { referralCode } });
      if (!existing) break;
      referralCode = generateReferralCode();
      attempts++;
    }

    user = await prisma.user.create({
      data: {
        telegramId,
        username: telegramUser.username || null,
        referralCode,
      },
    });
  } else if (telegramUser.username && user.username !== telegramUser.username) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { username: telegramUser.username },
    });
  }

  return user;
}

export function isSubscriptionActive(subscriptionEnd: Date | null): boolean {
  if (!subscriptionEnd) return false;
  return subscriptionEnd > new Date();
}
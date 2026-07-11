import { prisma } from '../utils/prisma';
import { TelegramUser } from '../middleware/validateTelegramAuth';

const BOT_API = 'https://api.telegram.org/bot';

export async function checkChannelSubscription(telegramId: number): Promise<boolean> {
  const botToken = process.env.BOT_TOKEN;
  const channelUsername = process.env.CHANNEL_USERNAME || 'primeform_channel';

  if (!botToken) return false;

  try {
    const res = await fetch(
      `${BOT_API}${botToken}/getChatMember?chat_id=@${channelUsername}&user_id=${telegramId}`
    );
    const data = (await res.json()) as {
      ok: boolean;
      result?: { status: string };
    };

    if (!data.ok) return false;

    const status = data.result?.status;
    if (!status) return false;
    return ['creator', 'administrator', 'member'].includes(status);
  } catch {
    return false;
  }
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
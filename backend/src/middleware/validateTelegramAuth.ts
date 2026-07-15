import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface AuthRequest extends Request {
  telegramUser?: TelegramUser;
}

function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function validateInitData(initData: string, botToken: string): TelegramUser | null {
  const params = parseInitData(initData);
  const hash = params.hash;
  if (!hash) return null;

  const dataCheckArr = Object.keys(params)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${params[key]}`);

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckArr.join('\n'))
    .digest('hex');

  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
    if (hashBuffer.length !== calculatedBuffer.length) return null;
    if (!timingSafeEqual(hashBuffer, calculatedBuffer)) return null;
  } catch {
    return null;
  }

  const authDate = parseInt(params.auth_date || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  const maxAgeSec = parseInt(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SEC || String(7 * 86400), 10);
  if (now - authDate > maxAgeSec) return null;

  if (!params.user) return null;
  try {
    return JSON.parse(params.user) as TelegramUser;
  } catch {
    return null;
  }
}

export function validateTelegramAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const initData =
    (req.headers['x-telegram-init-data'] as string) ||
    (req.body?.initData as string);

  if (!initData) {
    res.status(401).json({ error: 'Отсутствуют данные авторизации Telegram' });
    return;
  }

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    res.status(500).json({ error: 'Сервер не настроен' });
    return;
  }

  const user = validateInitData(initData, botToken);
  if (!user) {
    res.status(401).json({
      error: 'Недействительные данные авторизации',
      hint: 'Закройте приложение и откройте Primeform снова из бота в Telegram',
    });
    return;
  }

  req.telegramUser = user;
  next();
}
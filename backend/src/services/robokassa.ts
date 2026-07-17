import { createHash } from 'crypto';

const SUBSCRIPTION_PRICE = 400;
const SUBSCRIPTION_DAYS = 30;

export function getSubscriptionPrice(): number {
  return SUBSCRIPTION_PRICE;
}

export function generatePaymentUrl(userId: number): string {
  const login = process.env.ROBOKASSA_LOGIN!;
  const password1 = process.env.ROBOKASSA_PASSWORD1!;
  const appUrl = process.env.APP_URL || 'https://primeform.example.com';
  const isTest = process.env.ROBOKASSA_TEST_MODE === 'true';

  const outSum = SUBSCRIPTION_PRICE.toFixed(2);
  const invId = 0;
  const description = encodeURIComponent('Подписка Primeform. 1 месяц');
  const shpUserId = `shp_userId=${userId}`;

  const signatureBase = `${login}:${outSum}:${invId}:${password1}:${shpUserId}`;
  const signature = createHash('md5').update(signatureBase).digest('hex');

  const params = new URLSearchParams({
    MerchantLogin: login,
    OutSum: outSum,
    InvId: String(invId),
    Description: 'Подписка Primeform. 1 месяц',
    SignatureValue: signature,
    'shp_userId': String(userId),
    SuccessURL: `${appUrl}/payment/success`,
    FailURL: `${appUrl}/payment/fail`,
  });

  if (isTest) {
    params.set('IsTest', '1');
  }

  return `https://auth.robokassa.ru/Merchant/Index.aspx?${params.toString()}`;
}

export function verifyWebhookSignature(
  outSum: string,
  invId: string,
  signatureValue: string,
  shpUserId: string
): boolean {
  const password2 = process.env.ROBOKASSA_PASSWORD2!;
  const signatureBase = `${outSum}:${invId}:${password2}:shp_userId=${shpUserId}`;
  const calculated = createHash('md5').update(signatureBase).digest('hex').toUpperCase();
  return calculated === signatureValue.toUpperCase();
}

export function getSubscriptionDays(): number {
  return SUBSCRIPTION_DAYS;
}
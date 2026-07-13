import { Router, Response, Request } from 'express';
import { AuthRequest, validateTelegramAuth } from '../middleware/validateTelegramAuth';
import { findOrCreateUser, isSubscriptionActive, sendBotMessage } from '../services/telegram';
import { generatePaymentUrl, verifyWebhookSignature, getSubscriptionDays } from '../services/robokassa';
import { getSkincarePreviewProducts } from '../data/wildberriesSkincare';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/status', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    res.json({
      active: isSubscriptionActive(user.subscriptionEnd),
      subscriptionEnd: user.subscriptionEnd,
      price: 400,
      skincarePreview: getSkincarePreviewProducts(3),
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

router.post('/create-payment', validateTelegramAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findOrCreateUser(req.telegramUser!);
    const paymentUrl = generatePaymentUrl(user.id);
    res.json({ paymentUrl });
  } catch (err) {
    console.error('Payment creation error:', err);
    res.status(500).json({ error: 'Ошибка создания платежа' });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { OutSum, InvId, SignatureValue, shp_userId } = req.body;

    if (!verifyWebhookSignature(OutSum, InvId, SignatureValue, shp_userId)) {
      res.status(400).send('bad sign');
      return;
    }

    const userId = parseInt(shp_userId, 10);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).send('user not found');
      return;
    }

    const now = new Date();
    const currentEnd = user.subscriptionEnd && user.subscriptionEnd > now
      ? user.subscriptionEnd
      : now;

    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + getSubscriptionDays());

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionEnd: newEnd },
    });

    await sendBotMessage(
      Number(user.telegramId),
      `✅ Подписка Primeform активирована до ${newEnd.toLocaleDateString('ru-RU')}!`
    );

    res.send(`OK${InvId}`);
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('error');
  }
});

export default router;
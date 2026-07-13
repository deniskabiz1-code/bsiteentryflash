import { Router, Request, Response } from 'express';
import { processDueReminders } from '../services/reminders';

const router = Router();

function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_SECRET?.trim();
  if (!expected) return false;

  const header =
    (req.headers['x-admin-secret'] as string | undefined)
    || (req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');

  return Boolean(header && header === expected);
}

router.post('/reminders', async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await processDueReminders();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron] reminders failed:', err);
    res.status(500).json({ error: 'Reminder job failed' });
  }
});

export default router;
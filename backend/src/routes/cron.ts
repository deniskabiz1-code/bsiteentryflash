import { Router, Request, Response } from 'express';
import { isAdminAuthorized } from '../middleware/adminAuth';
import { processDueReminders } from '../services/reminders';

const router = Router();

router.post('/reminders', async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
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
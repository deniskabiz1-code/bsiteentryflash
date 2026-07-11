import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth';
import onboardingRoutes from './routes/onboarding';
import analysisRoutes from './routes/analysis';
import tasksRoutes from './routes/tasks';
import subscriptionRoutes from './routes/subscription';
import referralRoutes from './routes/referral';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 3001;
const uploadDir = process.env.UPLOAD_DIR || './uploads';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith('.github.io')) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(uploadDir)));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Primeform' });
});

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
  console.log(`Primeform backend running on port ${PORT}`);
});
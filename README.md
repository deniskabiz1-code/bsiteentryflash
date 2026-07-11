# Primeform

AI-powered Telegram Mini App for personal appearance improvement (Russian-speaking men).

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + @twa-dev/sdk
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **AI:** OpenAI GPT-4o (vision)
- **Payments:** Robokassa (400 ₽/month)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your secrets
npm install
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend dev server proxies `/api` and `/uploads` to `localhost:3001`.

### Production (VDS)

1. Build frontend: `cd frontend && npm run build`
2. Build backend: `cd backend && npm run build`
3. Copy `nginx.conf` to `/etc/nginx/sites-available/primeform`
4. Run Certbot: `certbot --nginx -d primeform.example.com`
5. Start backend with PM2: `pm2 start dist/index.js --name primeform`

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

## Telegram Bot Setup

1. Create bot via @BotFather
2. Set Mini App URL to your HTTPS domain
3. Add bot as admin to your channel (for subscription check)
4. Set `BOT_TOKEN` and `CHANNEL_USERNAME` in backend `.env`

## Admin Endpoint

Approve TikTok referral proofs:

```bash
curl -X POST https://your-domain/api/referral/admin/approve \
  -H "X-Admin-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"proofId": 1, "action": "approve"}'
```

## TODO

- [ ] Hairstyle try-on (DALL-E / hair swap API integration)
- [ ] Telegram bot daily reminder cron job
- [ ] Bot `/start ref_CODE` handler for referral links
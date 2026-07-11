# Deploy Primeform (Supabase + GitHub Pages + Render)

## Architecture

| Part | Host | URL |
|------|------|-----|
| Database | Supabase | PostgreSQL |
| Frontend | GitHub Pages | `https://YOU.github.io/REPO/` |
| Backend API | Render (free) | `https://primeform-api.onrender.com` |

> GitHub Pages only hosts static files. The backend must run on Render (or Railway/Fly).

---

## 1. Supabase (database)

1. Go to [supabase.com](https://supabase.com) → New project
2. **Project Settings → Database → Connection string**
3. Copy two URLs:
   - **Transaction pooler** (port 6543) → `DATABASE_URL`
   - **Direct** (port 5432) → `DIRECT_URL`
4. Replace `[YOUR-PASSWORD]` with your DB password

---

## 2. Render (backend API)

1. Push this repo to GitHub (repo root = `Primeform` folder contents)
2. Go to [render.com](https://render.com) → New → **Blueprint** → connect repo
   - Or: New Web Service → root dir `backend`
3. Set environment variables from `backend/.env.example`
4. Important:
   ```
   FRONTEND_URL=https://YOURUSERNAME.github.io/YOUR-REPO-NAME
   APP_URL=https://YOURUSERNAME.github.io/YOUR-REPO-NAME
   DATABASE_URL=...supabase pooler...
   DIRECT_URL=...supabase direct...
   BOT_TOKEN=...from BotFather...
   ```
5. Deploy → copy your Render URL, e.g. `https://primeform-api.onrender.com`

Test: open `https://YOUR-API.onrender.com/api/health`

---

## 3. GitHub Pages (frontend)

1. GitHub repo → **Settings → Pages**
   - Source: **GitHub Actions**
2. **Settings → Secrets and variables → Actions** → add:
   | Secret | Value |
   |--------|-------|
   | `VITE_API_URL` | `https://primeform-api.onrender.com/api` |
   | `VITE_CHANNEL_USERNAME` | your channel without @ |
3. Push to `main` — workflow deploys automatically
4. Your app: `https://YOURUSERNAME.github.io/YOUR-REPO-NAME/`

---

## 4. Telegram bot (view on phone)

1. @BotFather → your bot → **Bot Settings → Menu Button**
2. Set URL: `https://YOURUSERNAME.github.io/YOUR-REPO-NAME/`
3. Open bot on phone → tap menu button → app loads with real auth

> Opening the GitHub Pages URL in Safari won't work (no Telegram auth). Use the bot.

---

## 5. Local dev (real API, no mock)

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # fill in Supabase + BOT_TOKEN
npm install
npx prisma db push
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Mock mode is **off** by default. Frontend proxies to `localhost:3001`.

---

## Checklist

- [ ] Supabase project created, tables pushed (`prisma db push`)
- [ ] Render backend live, `/api/health` returns OK
- [ ] GitHub Pages deployed
- [ ] `VITE_API_URL` secret points to Render
- [ ] Telegram bot menu URL set to GitHub Pages
- [ ] Bot is admin in your channel
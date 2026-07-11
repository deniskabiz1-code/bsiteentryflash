const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL =
  process.env.WEBAPP_BASE_URL
  || 'https://deniskabiz1-code.github.io/bsiteentryflash/';
const buildId = (process.argv[2] || process.env.GITHUB_SHA || '').trim();

if (!BOT_TOKEN) {
  console.log('BOT_TOKEN not set — skip Telegram menu URL update');
  process.exit(0);
}

if (!buildId) {
  console.error('Missing build id for menu URL update');
  process.exit(1);
}

const shortId = buildId.slice(0, 8);
const appUrl = new URL(BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`);
appUrl.searchParams.set('pf_v', shortId);

async function getMenuText() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMenuButton`);
    const data = await res.json();
    return data?.result?.text || 'Primeform';
  } catch {
    return 'Primeform';
  }
}

const menuText = await getMenuText();

const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    menu_button: {
      type: 'web_app',
      text: menuText,
      web_app: { url: appUrl.toString() },
    },
  }),
});

const data = await res.json();
if (!data.ok) {
  console.error('setChatMenuButton failed:', data.description);
  process.exit(1);
}

console.log(`Telegram menu URL → ${appUrl.toString()}`);
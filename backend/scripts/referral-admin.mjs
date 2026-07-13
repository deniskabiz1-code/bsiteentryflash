#!/usr/bin/env node
/**
 * Manage TikTok referral proof approvals.
 *
 * Usage:
 *   API_URL=https://bsiteentryflash.onrender.com ADMIN_SECRET=xxx node referral-admin.mjs list
 *   API_URL=... ADMIN_SECRET=... node referral-admin.mjs approve 12
 *   API_URL=... ADMIN_SECRET=... node referral-admin.mjs reject 12
 */

const API_URL = (process.env.API_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim();
const [command, proofIdArg] = process.argv.slice(2);

if (!API_URL || !ADMIN_SECRET) {
  console.error('Set API_URL and ADMIN_SECRET environment variables.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-Admin-Secret': ADMIN_SECRET,
};

async function listPending() {
  const res = await fetch(`${API_URL}/api/referral/admin/pending`, { headers });
  const data = await res.json();
  if (!res.ok) {
    console.error(data.error || res.statusText);
    process.exit(1);
  }
  if (!data.proofs?.length) {
    console.log('No pending proofs.');
    return;
  }
  for (const proof of data.proofs) {
    const user = proof.user?.username ? `@${proof.user.username}` : proof.user?.telegramId;
    const urls = proof.imageFullUrls?.length ? proof.imageFullUrls : [];
    console.log(`#${proof.id}  ${user}  ${urls.length} screenshot(s)`);
    for (const url of urls) {
      console.log(`  ${url}`);
    }
  }
}

async function review(action) {
  const proofId = Number(proofIdArg);
  if (!proofId) {
    console.error(`Usage: node referral-admin.mjs ${action} <proofId>`);
    process.exit(1);
  }
  const res = await fetch(`${API_URL}/api/referral/admin/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ proofId, action }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(data.error || res.statusText);
    process.exit(1);
  }
  console.log(data.message || 'OK');
}

if (command === 'list') {
  await listPending();
} else if (command === 'approve' || command === 'reject') {
  await review(command);
} else {
  console.log('Commands: list | approve <id> | reject <id>');
  process.exit(1);
}
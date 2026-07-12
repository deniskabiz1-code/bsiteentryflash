import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const imgPath = path.join(process.cwd(), 'scripts', '_test-pixel.png');
fs.writeFileSync(imgPath, png);

const baseURL = (process.env.OPENAI_BASE_URL || '').replace(/\/+$/, '') || undefined;
const model = process.env.OPENAI_MODEL || 'gpt-4o';
const apiKey = process.env.OPENAI_API_KEY;
const reasoning = process.env.OPENAI_REASONING_EFFORT?.trim();
const timeout = Number(process.env.OPENAI_TIMEOUT_MS || 25_000);

const imageB64 = `data:image/png;base64,${png.toString('base64')}`;

async function run(label, opts) {
  const client = new OpenAI({ apiKey, baseURL, timeout: opts.timeout ?? timeout, maxRetries: 0 });
  const body = {
    model,
    messages: [
      { role: 'system', content: 'Return JSON: {"ok":true}' },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image briefly as JSON.' },
          { type: 'image_url', image_url: { url: imageB64, detail: opts.detail || 'low' } },
        ],
      },
    ],
    max_tokens: 300,
  };
  if (opts.jsonMode) body.response_format = { type: 'json_object' };
  if (opts.reasoning) body.reasoning_effort = opts.reasoning;

  const started = Date.now();
  try {
    const res = await client.chat.completions.create(body);
    if (!res?.choices?.length) {
      console.log(`[fail] ${label} (${Date.now() - started}ms): empty choices`, JSON.stringify(res).slice(0, 400));
      return false;
    }
    const content = res.choices[0]?.message?.content || '';
    console.log(`[ok] ${label} (${Date.now() - started}ms): ${content.slice(0, 120)}`);
    return true;
  } catch (err) {
    const msg = err?.message || String(err);
    const status = err?.status;
    const body = err?.error ? JSON.stringify(err.error).slice(0, 300) : '';
    console.log(`[fail] ${label} (${Date.now() - started}ms): status=${status} ${msg.slice(0, 200)} ${body}`);
    return false;
  }
}

console.log('baseURL:', baseURL || '(default openai)');
console.log('model:', model);
console.log('timeout:', timeout);
console.log('reasoning env:', reasoning || '(none)');

await run('json+low+no-reasoning', { jsonMode: true, detail: 'low' });
await run('no-json+low+no-reasoning', { jsonMode: false, detail: 'low' });
if (reasoning) {
  await run('json+low+env-reasoning', { jsonMode: true, detail: 'low', reasoning });
}
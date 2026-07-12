import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import {
  DEMO_FACE_RESULT,
  DEMO_HAIRSTYLE_RESULT,
  demoDelay,
} from '../data/demoAnalysis';

let openai: OpenAI | null = null;
let cachedConfigKey = '';

export type AiProviderInfo = {
  configured: boolean;
  demo: boolean;
  provider: string;
  model: string;
  baseUrl: string | null;
};

type AiConfig = {
  apiKey: string;
  baseURL: string | undefined;
  model: string;
  jsonMode: boolean;
  visionDetail: 'high' | 'low' | 'auto';
  reasoningEffort?: string;
  provider: string;
};

function normalizeBaseUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return undefined;
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function resolveProviderLabel(baseURL?: string): string {
  if (!baseURL) return 'openai';
  const host = baseURL.toLowerCase();
  if (host.includes('deepseek')) return 'deepseek';
  if (host.includes('openrouter')) return 'openrouter';
  if (host.includes('together')) return 'together';
  if (host.includes('groq')) return 'groq';
  if (host.includes('siliconflow')) return 'siliconflow';
  return 'openai-compatible';
}

function resolveAiConfig(): AiConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const baseURL = normalizeBaseUrl(process.env.OPENAI_BASE_URL);
  const provider = resolveProviderLabel(baseURL);
  const defaultModel = baseURL ? 'gpt-5.5' : 'gpt-4o';
  const model = process.env.OPENAI_MODEL?.trim() || defaultModel;
  const jsonMode = process.env.OPENAI_JSON_MODE !== 'false';
  const visionRaw = process.env.OPENAI_VISION_DETAIL?.trim().toLowerCase();
  const visionDetail =
    visionRaw === 'low' || visionRaw === 'auto' || visionRaw === 'high'
      ? visionRaw
      : 'low';
  const reasoningEffort = process.env.OPENAI_REASONING_EFFORT?.trim() || undefined;

  return { apiKey, baseURL, model, jsonMode, visionDetail, reasoningEffort, provider };
}

export function getAiProviderInfo(): AiProviderInfo {
  const config = resolveAiConfig();
  const demo = shouldUseDemoAnalysis();
  return {
    configured: Boolean(config),
    demo,
    provider: config?.provider ?? 'none',
    model: config?.model ?? 'none',
    baseUrl: config?.baseURL ?? null,
  };
}

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function shouldUseDemoAnalysis(): boolean {
  if (process.env.USE_DEMO_ANALYSIS === 'true') return true;
  return !isOpenAiConfigured();
}

export type AnalysisRunResult = {
  data: Record<string, unknown>;
  demo: boolean;
};

const AI_REQUEST_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 55_000);

function getOpenAI(): OpenAI {
  const config = resolveAiConfig();
  if (!config) {
    throw new Error('OPENAI_API_KEY не настроен на сервере');
  }

  const configKey = `${config.apiKey}|${config.baseURL ?? ''}|${config.model}|${AI_REQUEST_TIMEOUT_MS}`;
  if (!openai || cachedConfigKey !== configKey) {
    openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: AI_REQUEST_TIMEOUT_MS,
      maxRetries: 0,
    });
    cachedConfigKey = configKey;
    console.log(`[ai] Provider: ${config.provider}, model: ${config.model}, base: ${config.baseURL ?? 'default'}`);
  }

  return openai;
}

function parseCompletionResponse(response: unknown): OpenAI.Chat.ChatCompletion {
  if (typeof response === 'string') {
    const trimmed = response.trim();
    if (trimmed.startsWith('<')) {
      throw new Error('AI provider returned HTML — check OPENAI_BASE_URL (needs /v1)');
    }
    return JSON.parse(trimmed) as OpenAI.Chat.ChatCompletion;
  }
  if (response && typeof response === 'object' && 'choices' in response) {
    return response as OpenAI.Chat.ChatCompletion;
  }
  throw new Error('Unexpected AI response format');
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timeout after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const FACE_ANALYSIS_PROMPT = `You are an expert aesthetician and facial analyst. Analyze the provided face photo and return ONLY valid JSON with this exact structure:

{
"overall_score": <integer 0-100>,
"scores": {
"skin": <integer 0-100>,
"jawline": <integer 0-100>,
"symmetry": <integer 0-100>,
"hairstyle": <integer 0-100>
},
"skin_type": "dry" | "oily" | "combination" | "normal",
"puffiness": "low" | "medium" | "high",
"problem_zones": [
{ "zone": "<name in Russian>", "description": "<explanation in Russian>" }
],
"improvement_tips": ["<tip in Russian>"],
"growth_plan": [
{ "step": 1, "action": "<Russian>", "timeline": "<Russian>", "progress_metric": "<Russian>" },
{ "step": 2, ... },
{ "step": 3, ... },
{ "step": 4, ... }
],
"skincare_routine": [
{ "step": "<step name in Russian>", "product_type": "<Russian>", "tip": "<Russian>" }
]
}

All text fields must be in Russian. Be honest but encouraging. Do not include any text outside the JSON object.`;

const HAIRSTYLE_ANALYSIS_PROMPT = `You are an expert barber and facial analyst. Analyze the provided face photos (front and side profile) and return ONLY valid JSON with this exact structure:

{
"face_shape": "oval" | "square" | "round" | "heart" | "oblong",
"best_haircuts": [
{ "name": "<Russian>", "description": "<Russian>" },
{ "name": "<Russian>", "description": "<Russian>" },
{ "name": "<Russian>", "description": "<Russian>" }
],
"avoid": ["<Russian>"],
"beard_recommendation": { "recommended": true | false, "shape": "<Russian or empty>" },
"barber_brief": "<short text in Russian the user can show to a barber>"
}

All text fields must be in Russian. Be honest but encouraging. Do not include any text outside the JSON object.`;

function imageToBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.heic' || ext === '.heif') {
    throw new Error('HEIC requires conversion before AI analysis');
  }
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function requestVision(
  systemPrompt: string,
  imagePaths: string[],
  useJsonMode: boolean,
): Promise<string> {
  const config = resolveAiConfig();
  if (!config) throw new Error('AI not configured');

  const imageContents = imagePaths.map((p) => ({
    type: 'image_url' as const,
    image_url: { url: imageToBase64(p), detail: config.visionDetail },
  }));

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Проанализируй это фото и верни JSON.' },
          ...imageContents,
        ],
      },
    ],
    max_tokens: 4096,
  };
  if (useJsonMode) {
    body.response_format = { type: 'json_object' };
  }
  if (config.reasoningEffort) {
    body.reasoning_effort = config.reasoningEffort;
  }

  const raw = await withTimeout(
    getOpenAI().chat.completions.create(
      body as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    ),
    AI_REQUEST_TIMEOUT_MS,
    'AI vision request',
  );
  const response = parseCompletionResponse(raw);

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Пустой ответ от AI');
  return content;
}

function parseJsonResponse(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Ответ AI не содержит JSON');
    return JSON.parse(match[0]);
  }
}

async function callVision(
  systemPrompt: string,
  imagePaths: string[],
): Promise<Record<string, unknown>> {
  const config = resolveAiConfig();
  if (!config) throw new Error('AI not configured');

  try {
    const content = await requestVision(systemPrompt, imagePaths, config.jsonMode);
    return parseJsonResponse(content);
  } catch (firstErr) {
    if (!config.jsonMode) throw firstErr;
    console.warn('[ai] JSON mode failed, retrying without response_format:', firstErr);
    const content = await requestVision(systemPrompt, imagePaths, false);
    return parseJsonResponse(content);
  }
}

export async function analyzeFace(photoPath: string): Promise<AnalysisRunResult> {
  if (shouldUseDemoAnalysis()) {
    console.log('[demo] Face analysis — demo mode');
    await demoDelay();
    return { data: { ...DEMO_FACE_RESULT }, demo: true };
  }

  try {
    const data = await callVision(FACE_ANALYSIS_PROMPT, [photoPath]);
    return { data, demo: false };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[ai] Face analysis failed, using demo data:', detail);
    await demoDelay();
    return { data: { ...DEMO_FACE_RESULT }, demo: true };
  }
}

export async function analyzeHairstyle(
  frontPath: string,
  sidePath: string
): Promise<AnalysisRunResult> {
  if (shouldUseDemoAnalysis()) {
    console.log('[demo] Hairstyle analysis — demo mode');
    await demoDelay();
    return { data: { ...DEMO_HAIRSTYLE_RESULT }, demo: true };
  }

  try {
    const data = await callVision(HAIRSTYLE_ANALYSIS_PROMPT, [frontPath, sidePath]);
    return { data, demo: false };
  } catch (err) {
    console.error('[ai] Hairstyle analysis failed, using demo data:', err);
    await demoDelay();
    return { data: { ...DEMO_HAIRSTYLE_RESULT }, demo: true };
  }
}

export async function generateHairstylePreview(
  _photoPath: string,
  hairstyleName: string
): Promise<string | null> {
  // TODO: Integrate hair swap API or DALL-E img2img
  console.log(`Hairstyle try-on stub for: ${hairstyleName}`);
  return null;
}
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import {
  DEMO_FACE_RESULT,
  DEMO_HAIRSTYLE_RESULT,
  demoDelay,
} from '../data/demoAnalysis';
import {
  buildFaceAnalysisUserMessage,
  type FaceAnalysisUserContext,
} from './analysisHistory';

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
],
"progress_vs_last": {
"has_previous": <true if prior analyses were provided, else false>,
"overall_delta": <integer: current overall_score minus previous overall_score, 0 if first analysis>,
"summary": "<1-2 sentences in Russian: what improved, regressed, or stayed stable since last check-in>",
"metric_deltas": {
"skin": <integer delta vs last analysis>,
"jawline": <integer delta>,
"symmetry": <integer delta>,
"hairstyle": <integer delta>
}
}

SCORING RULES (mandatory — follow strictly):
- Use the full range. Do NOT default every score to the low 70s. Typical overall_score spread: 48–88 depending on the photo.
- Score skin, jawline, symmetry, and hairstyle INDEPENDENTLY from what you see. They should often differ by 10–25 points (e.g. skin 54, jawline 79, symmetry 71, hairstyle 63).
- Calibration guide:
  • 85–95: clearly strong in this area, visibly above average
  • 72–84: solid / slightly above average
  • 58–71: average with visible room to improve
  • 45–57: noticeable issues in this area
  • below 45: only for severe visible problems
- overall_score = rounded mean of the four sub-scores, then adjust by at most ±5 if the holistic impression differs.
- Scores above 82 or below 50 on any metric must match something clearly visible in the photo.
- Be honest, not flattering. Users need real differentiation between analyses.

CONTINUITY RULES (when prior analyses are provided in the user message):
- Treat this as a follow-up check-in, not a standalone rating.
- Compare the new photo to the most recent prior analysis. Adjust sub-scores to reflect visible improvement (+2 to +10), regression (-2 to -10), or stability (±2).
- overall_score must be consistent with sub-scores and the visible change since last time.
- improvement_tips: personalize — reference progress or persistent issues from prior tips/problem_zones; avoid repeating the exact same tip unless still the top priority.
- growth_plan: evolve prior steps — mark what to keep, intensify, or replace based on progress.
- progress_vs_last: fill honestly. overall_delta and metric_deltas must match your scoring vs the last entry in history.
- If no real change is visible, say so in summary and keep deltas near 0.

When no prior analyses are provided: set has_previous to false, overall_delta and all metric_deltas to 0, summary to "".

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

type VisionRequestOptions = {
  temperature?: number;
};

async function requestVision(
  systemPrompt: string,
  imagePaths: string[],
  useJsonMode: boolean,
  options: VisionRequestOptions = {},
  userText = 'Проанализируй это фото и верни JSON.',
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
          { type: 'text', text: userText },
          ...imageContents,
        ],
      },
    ],
    max_tokens: 4096,
  };
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
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
  if (!content) throw new Error('Пустой ответ от ИИ');
  return content;
}

function parseJsonResponse(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Ответ ИИ не содержит JSON');
    return JSON.parse(match[0]);
  }
}

async function callVision(
  systemPrompt: string,
  imagePaths: string[],
  options: VisionRequestOptions = {},
  userText?: string,
): Promise<Record<string, unknown>> {
  const config = resolveAiConfig();
  if (!config) throw new Error('AI not configured');

  try {
    const content = await requestVision(systemPrompt, imagePaths, config.jsonMode, options, userText);
    return parseJsonResponse(content);
  } catch (firstErr) {
    if (!config.jsonMode) throw firstErr;
    console.warn('[ai] JSON mode failed, retrying without response_format:', firstErr);
    const content = await requestVision(systemPrompt, imagePaths, false, options, userText);
    return parseJsonResponse(content);
  }
}

function buildDemoProgress(context?: FaceAnalysisUserContext): Record<string, unknown> {
  const last = context?.previousAnalyses[0];
  if (!last) {
    return {
      progress_vs_last: {
        has_previous: false,
        overall_delta: 0,
        summary: '',
        metric_deltas: { skin: 0, jawline: 0, symmetry: 0, hairstyle: 0 },
      },
    };
  }

  const current = DEMO_FACE_RESULT;
  const delta = (key: keyof typeof current.scores) =>
    (current.scores[key] ?? 0) - (last.scores[key] ?? 0);

  return {
    progress_vs_last: {
      has_previous: true,
      overall_delta: current.overall_score - last.overall_score,
      summary: 'Кожа выглядит чуть ровнее, контур челюсти стабилен. Продолжайте SPF и вечерний уход.',
      metric_deltas: {
        skin: delta('skin'),
        jawline: delta('jawline'),
        symmetry: delta('symmetry'),
        hairstyle: delta('hairstyle'),
      },
    },
  };
}

export async function analyzeFace(
  photoPath: string,
  context?: FaceAnalysisUserContext,
): Promise<AnalysisRunResult> {
  const userText = buildFaceAnalysisUserMessage(context);

  if (shouldUseDemoAnalysis()) {
    console.log('[demo] Face analysis — demo mode');
    await demoDelay();
    return {
      data: { ...DEMO_FACE_RESULT, ...buildDemoProgress(context) },
      demo: true,
    };
  }

  try {
    const data = await callVision(
      FACE_ANALYSIS_PROMPT,
      [photoPath],
      { temperature: 0.85 },
      userText,
    );
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
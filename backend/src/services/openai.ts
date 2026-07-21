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
import {
  buildSkincareCatalogPromptSection,
  normalizeSkincareRoutine,
  type SkincareAnalysisContext,
} from '../data/wildberriesSkincare';
import { enrichAnalysisInsights } from './analysisInsights';

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
  const jsonMode = resolveJsonMode(baseURL);
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

function resolveJsonMode(baseURL?: string): boolean {
  const raw = process.env.OPENAI_JSON_MODE?.trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  // Custom OpenAI-compatible proxies often reject response_format.
  return !baseURL;
}

function shouldUseDemoAnalysis(): boolean {
  if (process.env.USE_DEMO_ANALYSIS === 'true') return true;
  return !isOpenAiConfigured();
}

function shouldFallbackToDemoOnError(): boolean {
  return process.env.AI_FALLBACK_DEMO === 'true';
}

function modelUsesCompletionTokens(model: string): boolean {
  const m = model.toLowerCase();
  return /(^|[-/])(o\d|gpt-5)/.test(m);
}

function modelSupportsReasoning(model: string): boolean {
  const m = model.toLowerCase();
  return /(^|[-/])(o\d|gpt-5)/.test(m);
}

export function toUserFacingAiError(detail: string): string {
  const lower = detail.toLowerCase();
  if (lower.includes('timeout')) {
    return 'ИИ слишком долго отвечает. Попробуйте ещё раз через минуту';
  }
  if (lower.includes('html') || lower.includes('openai_base_url')) {
    return 'Ошибка настройки ИИ на сервере (OPENAI_BASE_URL)';
  }
  if (
    lower.includes('api key')
    || lower.includes('authentication')
    || lower.includes('unauthorized')
    || lower.includes('401')
  ) {
    return 'ИИ временно недоступен. Проверьте ключ API на сервере';
  }
  if (
    lower.includes('model') && (lower.includes('not found') || lower.includes('does not exist') || lower.includes('invalid'))
    || lower.includes('404')
  ) {
    return 'Модель не найдена. Проверьте OPENAI_MODEL на Render';
  }
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota')) {
    return 'Лимит запросов к ИИ. Подождите минуту или проверьте баланс API';
  }
  if (
    lower.includes('vision')
    || lower.includes('image') && (lower.includes('not support') || lower.includes('unsupported'))
    || lower.includes('multimodal')
  ) {
    return 'Эта модель не поддерживает фото. Выберите vision-модель';
  }
  if (lower.includes('empty') || lower.includes('пустой')) {
    return 'ИИ вернул пустой ответ. Попробуйте другую модель или позже';
  }
  if (lower.includes('json')) {
    return 'ИИ вернул некорректный ответ. Попробуйте ещё раз';
  }
  // Keep a short technical hint for operators (shown in app; still user-readable)
  const short = detail.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (short.length > 20) {
    return `ИИ временно недоступен (${short})`;
  }
  return 'ИИ временно недоступен. Попробуйте позже';
}

export type AnalysisRunResult = {
  data: Record<string, unknown>;
  demo: boolean;
};

// Keep under typical reverse-proxy limits (~100s on Render free/starter).
const AI_REQUEST_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 75_000);
const AI_RETRY_TIMEOUT_MS = Number(process.env.OPENAI_RETRY_TIMEOUT_MS || 40_000);
// First (reasoning) attempt must be shorter so a non-reasoning fallback can still run.
const AI_REASONING_ATTEMPT_MS = Number(process.env.OPENAI_REASONING_TIMEOUT_MS || 40_000);

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
      throw new Error('AI provider returned HTML. Check OPENAI_BASE_URL (needs /v1)');
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
"summary": "<2-3 sentences in Russian: honest personalized overview of what you see in THIS photo. Mention skin, strongest feature, and main area to improve>",
"strengths": ["<2-4 specific visible positives in Russian>"],
"quick_wins": [
{ "action": "<habit or grooming step doable this week, Russian>", "impact": "<what it improves, Russian>" }
],
"photo_feedback": "<how lighting, camera angle, and distance affect this analysis + tip for the next selfie, Russian>",
"hair_notes": "<1-2 sentences about current hairstyle: what works, what to change, Russian>",
"face_shape": "oval" | "square" | "round" | "heart" | "oblong",
"best_haircuts": [
{ "name": "<haircut name in Russian>", "description": "<why it fits THIS person's face shape, линия челюсти, and proportions. Specific, Russian>" },
{ "name": "<Russian>", "description": "<Russian>" },
{ "name": "<Russian>", "description": "<Russian>" }
],
"haircuts_to_avoid": ["<haircut/style to avoid for this face, Russian>"],
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
{ "step": "<morning/evening step name in Russian>", "product_id": <exact id from AVAILABLE PRODUCTS>, "product_type": "<why this exact product fits THIS user, Russian>", "tip": "<personalized application tip, Russian>" }
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

LANGUAGE RULES (mandatory for ALL user-visible text in Russian):
- Never write the English word "jawline" (any casing) in summary, strengths, tips, zones, haircuts, growth_plan, or any other free-text field.
- In Russian always say «линия челюсти» (or «челюсть» / «контур челюсти» when natural). Never transliterate as «джавлайн» or similar.
- JSON keys must stay exactly as above (scores.jawline is the key name only; do not put English "jawline" into string values).

SCORING RULES (mandatory. Follow strictly):
- Use the full range. Do NOT default every score to the low 70s. Typical overall_score spread: 48-88 depending on the photo.
- Score skin, линия челюсти (JSON key jawline), symmetry, and hairstyle INDEPENDENTLY from what you see. They should often differ by 10-25 points (e.g. skin 54, jawline 79, symmetry 71, hairstyle 63).
- Calibration guide:
  • 85-95: clearly strong in this area, visibly above average
  • 72-84: solid / slightly above average
  • 58-71: average with visible room to improve
  • 45-57: noticeable issues in this area
  • below 45: only for severe visible problems
- overall_score = rounded mean of the four sub-scores, then adjust by at most ±5 if the holistic impression differs.
- Scores above 82 or below 50 on any metric must match something clearly visible in the photo.
- Be honest, not flattering. Users need real differentiation between analyses.

CONTINUITY RULES (when prior analyses are provided in the user message):
- Treat this as a follow-up check-in, not a standalone rating.
- Compare the new photo to the most recent prior analysis. Adjust sub-scores to reflect visible improvement (+2 to +10), regression (-2 to -10), or stability (±2).
- overall_score must be consistent with sub-scores and the visible change since last time.
- improvement_tips: personalize. Reference progress or persistent issues from prior tips/problem_zones; avoid repeating the exact same tip unless still the top priority.
- growth_plan: evolve prior steps. Mark what to keep, intensify, or replace based on progress.
- progress_vs_last: fill honestly. Overall_delta and metric_deltas must match your scoring vs the last entry in history.
- If no real change is visible, say so in summary and keep deltas near 0.

When no prior analyses are provided: set has_previous to false, overall_delta and all metric_deltas to 0, progress_vs_last.summary to "".

INSIGHT RULES (make the analysis useful, not just scores):
- summary, strengths, quick_wins, photo_feedback, and hair_notes are mandatory and must be specific to THIS photo.
- strengths: real positives only. Do not invent compliments.
- quick_wins: 2-3 items. Mix lifestyle (сон, вода, соль) and grooming; at least one about photo conditions.
- photo_feedback: always mention lighting and camera angle honestly if they limit accuracy.
- improvement_tips: 3-5 tips. Each must reference a visible issue from problem_zones or scores, not generic advice.
- problem_zones: at least 2 zones with concrete descriptions. Zone names in Russian only (e.g. «линия челюсти», not jawline).
- face_shape: infer from visible bone structure (forehead, cheekbones, jaw, face length).
- best_haircuts: exactly 3 options. Each must explain why it suits THIS face shape and current hairstyle score; reference линия челюсти / симметрия when relevant (never the English word jawline).
- haircuts_to_avoid: 2-3 styles that would work poorly for this face shape.

All text fields must be in Russian. Be honest but encouraging. Do not include any text outside the JSON object.`;

function getFaceAnalysisPrompt(): string {
  return `${FACE_ANALYSIS_PROMPT}${buildSkincareCatalogPromptSection()}`;
}

const FACE_ANALYSIS_LITE_PROMPT = `You are an expert facial analyst. Analyze the provided face photo and return ONLY valid JSON with this exact structure:

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
"summary": "<2 short sentences in Russian: honest overview of skin, strongest feature, and main area to improve>"
}

SCORING RULES (mandatory):
- Use the full range 48-88 for overall_score. Sub-scores should often differ by 10-25 points.
- overall_score = rounded mean of the four sub-scores (±5 max adjustment).
- Be honest, not flattering.

LANGUAGE: All free-text must be Russian. Never use the English word "jawline" in summary; say «линия челюсти» instead. JSON key scores.jawline stays as-is.

All text must be in Russian. Do not include any text outside the JSON object.`;

/** Strip English "jawline" from AI free text; keep JSON score keys intact. */
function replaceJawlineInRussianText(text: string): string {
  return text
    .replace(/\bjawline\b/gi, 'линия челюсти')
    .replace(/\bJawline\b/g, 'Линия челюсти')
    .replace(/\bJAWLINE\b/g, 'линия челюсти')
    .replace(/джавлайн/gi, 'линия челюсти');
}

function scrubJawlineFromAiText(value: unknown): unknown {
  if (typeof value === 'string') return replaceJawlineInRussianText(value);
  if (Array.isArray(value)) return value.map(scrubJawlineFromAiText);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      // Keep structural score keys; only clean string values nested under them
      out[key] = scrubJawlineFromAiText(child);
    }
    return out;
  }
  return value;
}

function normalizeLiteFaceAnalysisResult(
  data: Record<string, unknown>,
): Record<string, unknown> {
  return scrubJawlineFromAiText({
    overall_score: data.overall_score,
    scores: data.scores,
    skin_type: data.skin_type,
    puffiness: data.puffiness,
    summary: data.summary,
  }) as Record<string, unknown>;
}

function toLiteDemoResult(): Record<string, unknown> {
  const { overall_score, scores, skin_type, puffiness, summary } = DEMO_FACE_RESULT;
  return { overall_score, scores, skin_type, puffiness, summary };
}

function normalizeFaceAnalysisResult(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const scrubbed = scrubJawlineFromAiText(data) as Record<string, unknown>;
  const context: SkincareAnalysisContext = {
    skin_type: typeof scrubbed.skin_type === 'string' ? scrubbed.skin_type : undefined,
    puffiness: typeof scrubbed.puffiness === 'string' ? scrubbed.puffiness : undefined,
    problem_zones: Array.isArray(scrubbed.problem_zones)
      ? (scrubbed.problem_zones as { zone: string; description?: string }[])
      : undefined,
    scores: scrubbed.scores && typeof scrubbed.scores === 'object'
      ? (scrubbed.scores as { skin?: number })
      : undefined,
  };

  return enrichAnalysisInsights({
    ...scrubbed,
    skincare_routine: normalizeSkincareRoutine(scrubbed.skincare_routine, context),
  });
}

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

LANGUAGE: All free-text in Russian. Never use the English word "jawline"; write «линия челюсти» instead.

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
  /** Overrides global OPENAI_REASONING_EFFORT for this call (e.g. low free / high paid). */
  reasoningEffort?: string;
  /** Cap completion size — keep free/lite small so thinking tokens cannot explode. */
  maxOutputTokens?: number;
  /**
   * Prefer finishing under proxy limits over maximum quality.
   * Skips slow high-reasoning first pass; uses one fast strategy + one fallback.
   */
  preferSpeed?: boolean;
};

type VisionStrategy = {
  label: string;
  jsonMode: boolean;
  visionDetail: 'low' | 'high' | 'auto';
  useReasoning: boolean;
  useTemperature: boolean;
  timeoutMs: number;
};

function resolveReasoningEffort(mode: 'free' | 'full' | 'unlock'): string | undefined {
  if (mode === 'free' || mode === 'unlock') {
    // Unlock must finish inside HTTP limits — same low effort as free (which already works).
    const key = mode === 'unlock'
      ? process.env.OPENAI_REASONING_EFFORT_UNLOCK?.trim()
      : process.env.OPENAI_REASONING_EFFORT_FREE?.trim();
    return key || 'low';
  }
  // medium is the practical default: high often exceeds 60–90s on vision + JSON
  return (
    process.env.OPENAI_REASONING_EFFORT_FULL?.trim()
    || process.env.OPENAI_REASONING_EFFORT?.trim()
    || 'medium'
  );
}

function extractMessageContent(response: OpenAI.Chat.ChatCompletion): string {
  const choice = response.choices?.[0];
  const message = choice?.message as
    | (OpenAI.Chat.ChatCompletionMessage & {
        refusal?: string | null;
      })
    | undefined;

  if (!message) {
    throw new Error('Пустой ответ от ИИ');
  }

  if (typeof message.refusal === 'string' && message.refusal.trim()) {
    throw new Error(`ИИ отказал: ${message.refusal.trim().slice(0, 160)}`);
  }

  const raw = message.content;
  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }

  if (Array.isArray(raw)) {
    const joined = raw
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: string }).text || '');
        }
        return '';
      })
      .join('')
      .trim();
    if (joined) return joined;
  }

  const finish = choice?.finish_reason;
  if (finish === 'length') {
    throw new Error(
      'Пустой ответ от ИИ (лимит токенов). Увеличьте OPENAI_MAX_TOKENS_FULL на Render',
    );
  }
  throw new Error('Пустой ответ от ИИ');
}

async function requestVision(
  systemPrompt: string,
  imagePaths: string[],
  strategy: VisionStrategy,
  options: VisionRequestOptions = {},
  userText = 'Проанализируй это фото и верни JSON.',
): Promise<string> {
  const config = resolveAiConfig();
  if (!config) throw new Error('AI not configured');

  const imageContents = imagePaths.map((p) => ({
    type: 'image_url' as const,
    image_url: { url: imageToBase64(p), detail: strategy.visionDetail },
  }));

  const maxOut = options.maxOutputTokens ?? 4096;
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
  };

  if (modelUsesCompletionTokens(config.model)) {
    body.max_completion_tokens = maxOut;
  } else {
    body.max_tokens = maxOut;
  }

  // Reasoning models often reject temperature; only send when strategy allows
  if (strategy.useTemperature && options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (strategy.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  // Only attach reasoning when the strategy opts in — fallbacks must stay non-reasoning
  // so unlock/full analysis can recover from empty high-reasoning outputs.
  const effort = options.reasoningEffort ?? config.reasoningEffort;
  if (strategy.useReasoning && effort && modelSupportsReasoning(config.model)) {
    body.reasoning_effort = effort;
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: strategy.timeoutMs,
    maxRetries: 0,
  });

  const raw = await withTimeout(
    client.chat.completions.create(
      body as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    ),
    strategy.timeoutMs,
    `AI vision (${strategy.label})`,
  );
  const response = parseCompletionResponse(raw);
  return extractMessageContent(response);
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

function buildVisionStrategies(
  config: AiConfig,
  options: VisionRequestOptions = {},
): VisionStrategy[] {
  const detail = config.visionDetail;
  const strategies: VisionStrategy[] = [];
  const speed = Boolean(options.preferSpeed);
  const effort = options.reasoningEffort ?? config.reasoningEffort;
  const wantsReasoning = Boolean(
    effort && modelSupportsReasoning(config.model) && !speed,
  );

  // Slow path: optional reasoning first (short timeout so fallback still fits in ~100s)
  if (wantsReasoning) {
    strategies.push({
      label: `reason-${config.jsonMode ? 'json' : 'plain'}-low`,
      jsonMode: config.jsonMode,
      visionDetail: 'low',
      useReasoning: true,
      useTemperature: false,
      timeoutMs: AI_REASONING_ATTEMPT_MS,
    });
  }

  // Speed / unlock: one reasoning-low attempt (if model supports) OR plain json — still short
  if (speed && effort && modelSupportsReasoning(config.model)) {
    strategies.push({
      label: `speed-reason-${config.jsonMode ? 'json' : 'plain'}`,
      jsonMode: config.jsonMode,
      visionDetail: 'low',
      useReasoning: true,
      useTemperature: false,
      timeoutMs: Math.min(AI_REQUEST_TIMEOUT_MS, 55_000),
    });
  }

  // Reliable non-reasoning fallback (works when high/medium reasoning times out or empties)
  if (config.jsonMode) {
    strategies.push({
      label: 'json-low',
      jsonMode: true,
      visionDetail: 'low',
      useReasoning: false,
      useTemperature: true,
      timeoutMs: speed ? Math.min(AI_REQUEST_TIMEOUT_MS, 55_000) : AI_REQUEST_TIMEOUT_MS,
    });
  }

  strategies.push({
    label: config.jsonMode ? 'plain-low' : 'plain',
    jsonMode: false,
    visionDetail: 'low',
    useReasoning: false,
    useTemperature: true,
    timeoutMs: AI_RETRY_TIMEOUT_MS,
  });

  // Skip high-detail on speed path — larger images + high detail = slow
  if (!speed && (detail === 'high' || detail === 'auto')) {
    strategies.push({
      label: 'plain-high',
      jsonMode: false,
      visionDetail: detail,
      useReasoning: false,
      useTemperature: true,
      timeoutMs: AI_RETRY_TIMEOUT_MS,
    });
  }

  // Unlock/speed: at most 2 attempts total (budget for reverse proxy)
  if (speed) {
    return strategies.slice(0, 2);
  }

  return strategies;
}

async function callVision(
  systemPrompt: string,
  imagePaths: string[],
  options: VisionRequestOptions = {},
  userText?: string,
): Promise<Record<string, unknown>> {
  const config = resolveAiConfig();
  if (!config) throw new Error('AI not configured');

  const strategies = buildVisionStrategies(config, options);
  const errors: string[] = [];
  const started = Date.now();
  // Leave headroom under ~100s proxy cutoffs
  const hardBudgetMs = Number(process.env.OPENAI_HARD_BUDGET_MS || 95_000);

  for (const strategy of strategies) {
    const elapsed = Date.now() - started;
    if (elapsed + 5_000 >= hardBudgetMs) {
      console.warn(`[ai] Stopping strategies: hard budget ${hardBudgetMs}ms`);
      break;
    }
    // Clamp strategy timeout to remaining budget
    const remaining = hardBudgetMs - elapsed;
    const clamped: VisionStrategy = {
      ...strategy,
      timeoutMs: Math.min(strategy.timeoutMs, remaining),
    };

    try {
      const content = await requestVision(
        systemPrompt,
        imagePaths,
        clamped,
        options,
        userText,
      );
      console.log(`[ai] Vision success via ${clamped.label} (${Date.now() - started}ms)`);
      return parseJsonResponse(content);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.warn(`[ai] Vision failed (${clamped.label}):`, detail);
      errors.push(`${clamped.label}: ${detail}`);
      // Continue to next strategy after timeout — first attempt is intentionally short
    }
  }

  throw new Error(errors.join(' | '));
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

export type AnalyzeFaceProfile = 'default' | 'unlock';

export async function analyzeFace(
  photoPath: string,
  context?: FaceAnalysisUserContext,
  mode: 'lite' | 'full' = 'full',
  profile: AnalyzeFaceProfile = 'default',
): Promise<AnalysisRunResult> {
  const lite = mode === 'lite';
  const unlock = profile === 'unlock';
  const userText = lite
    ? 'Проанализируй это фото и верни JSON с оценками и кратким обзором.'
    : buildFaceAnalysisUserMessage(context);

  if (shouldUseDemoAnalysis()) {
    console.log(`[demo] Face analysis (${mode}/${profile}). Demo mode`);
    await demoDelay();
    return {
      data: lite
        ? normalizeLiteFaceAnalysisResult(toLiteDemoResult())
        : normalizeFaceAnalysisResult({
            ...DEMO_FACE_RESULT,
            ...buildDemoProgress(context),
          }),
      demo: true,
    };
  }

  const reasoningEffort = resolveReasoningEffort(
    lite ? 'free' : unlock ? 'unlock' : 'full',
  );
  // Free JSON is tiny; cap hard so reasoning cannot burn 1k+ tokens on a preview.
  // Unlock: smaller output = faster. Full default still needs reasoning headroom.
  const maxOutputTokens = lite
    ? Number(process.env.OPENAI_MAX_TOKENS_FREE || 768)
    : unlock
      ? Number(process.env.OPENAI_MAX_TOKENS_UNLOCK || 4096)
      : Number(process.env.OPENAI_MAX_TOKENS_FULL || 8192);

  try {
    console.log(
      `[ai] Face analysis mode=${mode} profile=${profile} reasoning=${reasoningEffort ?? 'none'} maxOut=${maxOutputTokens}`,
    );
    const raw = await callVision(
      lite ? FACE_ANALYSIS_LITE_PROMPT : getFaceAnalysisPrompt(),
      [photoPath],
      {
        temperature: lite ? 0.7 : 0.85,
        reasoningEffort,
        maxOutputTokens,
        preferSpeed: unlock,
      },
      userText,
    ) as Record<string, unknown>;
    const data = lite
      ? normalizeLiteFaceAnalysisResult(raw)
      : normalizeFaceAnalysisResult(raw);
    return { data, demo: false };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[ai] Face analysis failed:', detail);
    if (shouldFallbackToDemoOnError()) {
      console.warn('[ai] AI_FALLBACK_DEMO=true. Returning demo face result');
      await demoDelay();
      return {
        data: lite
          ? normalizeLiteFaceAnalysisResult(toLiteDemoResult())
          : normalizeFaceAnalysisResult({
              ...DEMO_FACE_RESULT,
              ...buildDemoProgress(context),
            }),
        demo: true,
      };
    }
    throw new Error(toUserFacingAiError(detail));
  }
}

export async function analyzeHairstyle(
  frontPath: string,
  sidePath: string
): Promise<AnalysisRunResult> {
  if (shouldUseDemoAnalysis()) {
    console.log('[demo] Hairstyle analysis. Demo mode');
    await demoDelay();
    return { data: { ...DEMO_HAIRSTYLE_RESULT }, demo: true };
  }

  try {
    // Hairstyle is subscription-only → same effort as full face analysis
    const reasoningEffort = resolveReasoningEffort('full');
    const data = scrubJawlineFromAiText(
      await callVision(HAIRSTYLE_ANALYSIS_PROMPT, [frontPath, sidePath], {
        reasoningEffort,
        maxOutputTokens: Number(process.env.OPENAI_MAX_TOKENS_FULL || 4096),
      }),
    ) as Record<string, unknown>;
    return { data, demo: false };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[ai] Hairstyle analysis failed:', detail);
    if (shouldFallbackToDemoOnError()) {
      await demoDelay();
      return { data: { ...DEMO_HAIRSTYLE_RESULT }, demo: true };
    }
    throw new Error(toUserFacingAiError(detail));
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
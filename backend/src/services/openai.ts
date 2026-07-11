import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import {
  DEMO_FACE_RESULT,
  DEMO_HAIRSTYLE_RESULT,
  demoDelay,
} from '../data/demoAnalysis';

let openai: OpenAI | null = null;

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

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY не настроен на сервере');
  }
  if (!openai) {
    openai = new OpenAI({ apiKey });
  }
  return openai;
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
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function callVision(
  systemPrompt: string,
  imagePaths: string[]
): Promise<Record<string, unknown>> {
  const imageContents = imagePaths.map((p) => ({
    type: 'image_url' as const,
    image_url: { url: imageToBase64(p), detail: 'high' as const },
  }));

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
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
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Пустой ответ от OpenAI');

  return JSON.parse(content);
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
    console.error('[demo] OpenAI face analysis failed, using demo data:', err);
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
    console.error('[demo] OpenAI hairstyle analysis failed, using demo data:', err);
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
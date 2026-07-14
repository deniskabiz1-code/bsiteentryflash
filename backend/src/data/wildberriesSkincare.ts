/** Curated marketplace picks for skincare routine — edit article IDs here. */
export type SkincareProductStore = 'wildberries' | 'ozon';

export type SkincareProductCategory =
  | 'cleanser_synergetic'
  | 'cleanser_orele'
  | 'cleanser_enzyme'
  | 'serum_salicylic'
  | 'serum_azelaic'
  | 'serum_azeloglicin'
  | 'serum_vitc'
  | 'serum_recovery'
  | 'moisturizer_orele'
  | 'moisturizer_vois'
  | 'eye_cream';

export interface WildberriesProduct {
  id: number;
  name: string;
  brand: string;
  priceRub: number;
  category: SkincareProductCategory;
  store: SkincareProductStore;
  description: string;
  bestFor: string;
}

export const SKINCARE_PRODUCT_CATALOG: WildberriesProduct[] = [
  {
    id: 328169906,
    name: 'Сыворотка для лица с салициловой кислотой 2% от прыщей',
    brand: 'GELTEK',
    priceRub: 1750,
    category: 'serum_salicylic',
    store: 'wildberries',
    description: 'Точечно против воспалений и закупоренных пор',
    bestFor: 'активные прыщи, закупоренные поры, жирная Т-зона',
  },
  {
    id: 1219734384,
    name: 'Пенка для умывания увлажняющая с гиалуроновой кислотой, 150 мл',
    brand: 'SYNERGETIC',
    priceRub: 250,
    category: 'cleanser_synergetic',
    store: 'ozon',
    description: 'Мягкое ежедневное очищение без стянутости',
    bestFor: 'нормальная и сухая кожа, мягкое ежедневное очищение, бюджетный уход',
  },
  {
    id: 309217385,
    name: 'Сыворотка для лица Азелаиновая кислота 10%',
    brand: 'Elementary',
    priceRub: 600,
    category: 'serum_azelaic',
    store: 'wildberries',
    description: 'Выравнивает тон и борется с постакне',
    bestFor: 'постакне, пигментные пятна, неровный тон',
  },
  {
    id: 382239531,
    name: 'Сыворотка для проблемной кожи с азелоглицином, 35 мл',
    brand: 'SEVEKI',
    priceRub: 500,
    category: 'serum_azeloglicin',
    store: 'wildberries',
    description: 'Снижает жирность и покраснения',
    bestFor: 'жирная проблемная кожа, покраснения, воспаления',
  },
  {
    id: 142044104,
    name: 'Энзимная пудра пилинг для умывания лица и тела, 220 мл',
    brand: 'VOIS',
    priceRub: 500,
    category: 'cleanser_enzyme',
    store: 'wildberries',
    description: 'Деликатное отшелушивание 1–2 раза в неделю',
    bestFor: 'неровная текстура, закрытые комедоны, отшелушивание 1–2 раза в неделю',
  },
  {
    id: 408376110,
    name: 'Матирующий крем для лица от прыщей и акне с ниацинамидом',
    brand: 'Orele',
    priceRub: 1200,
    category: 'moisturizer_orele',
    store: 'wildberries',
    description: 'Дневной уход с матовым финишем',
    bestFor: 'комбинированная и жирная кожа, дневной уход при акне',
  },
  {
    id: 191806476,
    name: 'Сыворотка для лица с витамином С от пигментации и постакне',
    brand: 'Orele',
    priceRub: 1100,
    category: 'serum_vitc',
    store: 'wildberries',
    description: 'Осветление следов и ровный тон',
    bestFor: 'тусклый тон, следы постакне, пигментация',
  },
  {
    id: 228767624,
    name: 'Пенка для умывания с травами увлажняющая от прыщей и сухости',
    brand: 'Orele',
    priceRub: 1100,
    category: 'cleanser_orele',
    store: 'wildberries',
    description: 'Очищение для проблемной и обезвоженной кожи',
    bestFor: 'комбинированная кожа, прыщи + сухость, бережное очищение',
  },
  {
    id: 2141553631,
    name: 'Сыворотка для ухода за кожей Восстановление, 30 мл',
    brand: 'KOEC lab',
    priceRub: 1000,
    category: 'serum_recovery',
    store: 'ozon',
    description: 'Восстановление барьера после активов',
    bestFor: 'чувствительная кожа, восстановление барьера, после активов',
  },
  {
    id: 696701797,
    name: 'Крем роллер для век и кожи вокруг глаз',
    brand: 'Kottur',
    priceRub: 350,
    category: 'eye_cream',
    store: 'wildberries',
    description: 'Уход за отёчностью и тёмными кругами',
    bestFor: 'отёчность под глазами, тёмные круги, утренняя отёчность',
  },
  {
    id: 1612315196,
    name: 'Крем для лица от прыщей с салициловой кислотой и ниацинамидом, 50 мл',
    brand: 'VOIS',
    priceRub: 300,
    category: 'moisturizer_vois',
    store: 'ozon',
    description: 'Лёгкий крем для проблемной кожи',
    bestFor: 'лёгкий бюджетный уход при прыщах, жирная кожа',
  },
];

export type SkincareAnalysisContext = {
  skin_type?: string;
  puffiness?: string;
  problem_zones?: { zone: string; description?: string }[];
  scores?: { skin?: number };
};

export type SkincareRoutineStep = {
  step: string;
  product_type: string;
  tip: string;
  product_id?: number;
};

export type EnrichedSkincareStep = SkincareRoutineStep & {
  product: WildberriesProduct | null;
};

export function skincareProductUrl(product: Pick<WildberriesProduct, 'id' | 'store'>): string {
  if (product.store === 'ozon') {
    return `https://www.ozon.ru/product/-${product.id}/`;
  }
  return `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`;
}

export function buildSkincareCatalogPromptSection(): string {
  const products = SKINCARE_PRODUCT_CATALOG.map((p) => ({
    product_id: p.id,
    store: p.store === 'ozon' ? 'OZON' : 'WB',
    brand: p.brand,
    name: p.name,
    price_rub: p.priceRub,
    best_for: p.bestFor,
  }));

  return `
AVAILABLE PRODUCTS (use ONLY these product_id values in skincare_routine):
${JSON.stringify(products, null, 2)}

SKINCARE ROUTINE RULES:
- Include exactly 4-6 steps covering morning and evening care.
- Every step MUST include product_id copied exactly from AVAILABLE PRODUCTS above.
- Pick products for THIS specific user based on their skin_type, problem_zones, puffiness, and skin score — never use a one-size-fits-all template.
- product_type: one sentence in Russian naming the product and explaining why it fits THIS user's visible issues.
- tip: practical personalized advice (reference their problem zones or skin type when relevant).
- Do not invent product_id values. Do not use the same product_id twice.
- Matching guide:
  • combination/oily + acne or T-zone oiliness → Orele пенка (228767624) or SEVEKI/GELTEK serum + mattifying Orele cream
  • post-acne marks, uneven tone → Elementary azelaic (309217385) or Orele vitamin C (191806476)
  • dry or dehydrated skin → SYNERGETIC foam (1219734384) + KOEC recovery (2141553631)
  • under-eye puffiness → Kottur eye roller (696701797)
  • rough texture / clogged pores → VOIS enzyme powder (142044104) as a 1-2×/week cleanse step
  • budget-friendly acne care → VOIS acne cream (1612315196)`;
}

export function matchProductCategory(step: string, productType: string): SkincareProductCategory | null {
  const text = `${step} ${productType}`.toLowerCase();

  if (/век|глаз|подглаз/.test(text)) return 'eye_cream';
  if (/энзим|пудр/.test(text)) return 'cleanser_enzyme';
  if (/салицил/.test(text)) {
    return /крем|увлажн/.test(text) ? 'moisturizer_vois' : 'serum_salicylic';
  }
  if (/азелоглицин/.test(text)) return 'serum_azeloglicin';
  if (/азелаин/.test(text)) return 'serum_azelaic';
  if (/витамин\s*c|вит\s*c|пигмент|постакне/.test(text)) return 'serum_vitc';
  if (/восстанов|барьер|регенер/.test(text)) return 'serum_recovery';
  if (/матирующ|ниацинамид/.test(text) && /крем/.test(text)) return 'moisturizer_orele';
  if (/крем/.test(text) && /прыщ|акне|проблем/.test(text)) return 'moisturizer_vois';
  if (/увлажн|крем/.test(text)) return 'moisturizer_orele';
  if (/orele|трав/.test(text) && /пенк|умыван|очищ/.test(text)) return 'cleanser_orele';
  if (/очищен|умыван|гель|пенк/.test(text)) return 'cleanser_synergetic';
  if (/сыворот|актив|ретинол/.test(text)) return 'serum_azelaic';

  return null;
}

function catalogProductById(id: number | undefined): WildberriesProduct | null {
  if (!id) return null;
  return SKINCARE_PRODUCT_CATALOG.find((p) => p.id === id) ?? null;
}

function problemText(context: SkincareAnalysisContext): string {
  const zones = (context.problem_zones ?? [])
    .map((z) => `${z.zone} ${z.description ?? ''}`)
    .join(' ')
    .toLowerCase();
  return `${context.skin_type ?? ''} ${context.puffiness ?? ''} ${zones}`;
}

function pickContextualProduct(
  step: string,
  context: SkincareAnalysisContext,
  used: Set<number>,
): WildberriesProduct | null {
  const text = `${step} ${problemText(context)}`.toLowerCase();
  const skinType = context.skin_type ?? 'combination';
  const hasAcne = /прыщ|акне|воспал|жирн|т-зон|комедон/.test(text) || skinType === 'oily';
  const hasDry = skinType === 'dry' || /сух|стянут|обезвож/.test(text);
  const hasPostacne = /постакне|пигмент|пятн|след/.test(text);
  const hasPuffiness = context.puffiness === 'high'
    || context.puffiness === 'medium'
    || /отёк|подглаз/.test(text);
  const isEvening = /вечер|ноч/.test(text);
  const isMorning = /утр/.test(text);

  const candidates: WildberriesProduct[] = [];

  if (/век|глаз|подглаз/.test(step.toLowerCase()) || hasPuffiness) {
    candidates.push(catalogProductById(696701797)!);
  }
  if (/энзим|пудр|отшелуш/.test(step.toLowerCase()) || /текстур|комедон/.test(text)) {
    candidates.push(catalogProductById(142044104)!);
  }
  if (/очищен|умыван|пенк|гель/.test(step.toLowerCase())) {
    if (hasAcne && (hasDry || skinType === 'combination')) candidates.push(catalogProductById(228767624)!);
    else if (hasAcne) candidates.push(catalogProductById(228767624)!);
    else if (hasDry) candidates.push(catalogProductById(1219734384)!);
    else candidates.push(catalogProductById(1219734384)!);
  }
  if (/сыворот|актив|лечени|терап/.test(step.toLowerCase())) {
    if (hasPostacne) candidates.push(catalogProductById(309217385)!, catalogProductById(191806476)!);
    else if (hasAcne) candidates.push(catalogProductById(382239531)!, catalogProductById(328169906)!);
    else if (hasDry) candidates.push(catalogProductById(2141553631)!);
    else candidates.push(catalogProductById(382239531)!);
  }
  if (/крем|увлажн|защит/.test(step.toLowerCase())) {
    if (hasAcne && isMorning) candidates.push(catalogProductById(408376110)!);
    else if (hasAcne) candidates.push(catalogProductById(1612315196)!, catalogProductById(408376110)!);
    else if (hasDry) candidates.push(catalogProductById(2141553631)!);
    else candidates.push(catalogProductById(408376110)!);
  }
  if (isEvening && hasPostacne) candidates.unshift(catalogProductById(309217385)!);
  if (isMorning && hasPuffiness) candidates.push(catalogProductById(696701797)!);

  for (const product of candidates) {
    if (product && !used.has(product.id)) return product;
  }

  const category = matchProductCategory(step, '');
  if (category) {
    const fallback = SKINCARE_PRODUCT_CATALOG.find((p) => p.category === category && !used.has(p.id));
    if (fallback) return fallback;
  }

  return SKINCARE_PRODUCT_CATALOG.find((p) => !used.has(p.id)) ?? null;
}

function personalizeStepCopy(
  step: SkincareRoutineStep,
  product: WildberriesProduct,
  context: SkincareAnalysisContext,
): SkincareRoutineStep {
  const zoneHint = context.problem_zones?.[0]?.zone;
  const generic = !step.product_type
    || !step.product_type.toLowerCase().includes(product.brand.toLowerCase());

  return {
    ...step,
    product_id: product.id,
    product_type: generic
      ? `${product.brand} — подходит при ${product.bestFor}${zoneHint ? ` (акцент: ${zoneHint})` : ''}`
      : step.product_type,
    tip: step.tip
      || (zoneHint
        ? `Наносите с учётом зоны «${zoneHint}»: ${product.description}`
        : product.description),
  };
}

export function resolveRoutineProduct(step: SkincareRoutineStep): WildberriesProduct | null {
  const byId = catalogProductById(step.product_id);
  if (byId) return byId;

  const category = matchProductCategory(step.step, step.product_type);
  if (category) {
    return SKINCARE_PRODUCT_CATALOG.find((p) => p.category === category) ?? null;
  }

  return null;
}

export function buildDefaultSkincareRoutine(context: SkincareAnalysisContext = {}): SkincareRoutineStep[] {
  const used = new Set<number>();
  const stepNames = [
    'Утро: очищение',
    'Утро: сыворотка',
    'Утро: увлажнение',
    'Вечер: очищение',
    'Вечер: активный уход',
  ];

  if (context.puffiness === 'medium' || context.puffiness === 'high') {
    stepNames.splice(3, 0, 'Утро: уход за областью вокруг глаз');
  }

  return stepNames.map((stepName) => {
    const product = pickContextualProduct(stepName, context, used);
    if (!product) {
      return { step: stepName, product_type: '', tip: '' };
    }
    used.add(product.id);
    return personalizeStepCopy({ step: stepName, product_type: '', tip: '' }, product, context);
  });
}

export function normalizeSkincareRoutine(
  raw: unknown,
  context: SkincareAnalysisContext = {},
): SkincareRoutineStep[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return buildDefaultSkincareRoutine(context);
  }

  const used = new Set<number>();
  const normalized: SkincareRoutineStep[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;
    const step = String(record.step ?? '').trim();
    if (!step) continue;

    let product_type = String(record.product_type ?? '').trim();
    let tip = String(record.tip ?? '').trim();
    let product_id = Number(record.product_id);
    let product = catalogProductById(Number.isFinite(product_id) ? product_id : undefined);

    if (!product) {
      product = pickContextualProduct(step, context, used)
        ?? resolveRoutineProduct({ step, product_type, tip, product_id })
        ?? pickContextualProduct(step, context, new Set());
    }

    if (!product) continue;

    if (used.has(product.id)) {
      const alternate = pickContextualProduct(step, context, used);
      if (alternate) product = alternate;
    }

    used.add(product.id);
    const stepData = personalizeStepCopy(
      { step, product_type, tip, product_id: product.id },
      product,
      context,
    );
    normalized.push(stepData);
  }

  if (normalized.length < 4) {
    const defaults = buildDefaultSkincareRoutine(context);
    for (const fallback of defaults) {
      if (normalized.length >= 5) break;
      if (!fallback.product_id || normalized.some((s) => s.product_id === fallback.product_id)) continue;
      normalized.push(fallback);
    }
  }

  return normalized.slice(0, 6);
}

export function enrichSkincareRoutine(routine: SkincareRoutineStep[]): EnrichedSkincareStep[] {
  return routine.map((item) => ({
    ...item,
    product: resolveRoutineProduct(item),
  }));
}

export function getSkincarePreviewProducts(limit = 4): WildberriesProduct[] {
  return SKINCARE_PRODUCT_CATALOG.slice(0, limit);
}
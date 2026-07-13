/** Keep in sync with backend/src/data/wildberriesSkincare.ts */
export type SkincareProductCategory =
  | 'cleanser'
  | 'moisturizer'
  | 'spf'
  | 'micellar'
  | 'retinol';

export interface WildberriesProduct {
  id: number;
  name: string;
  brand: string;
  priceRub: number;
  category: SkincareProductCategory;
  description: string;
}

export const SKINCARE_PRODUCT_CATALOG: WildberriesProduct[] = [
  {
    id: 176654432,
    name: 'Гель для умывания Effaclar',
    brand: 'La Roche-Posay',
    priceRub: 890,
    category: 'cleanser',
    description: 'Мягкое очищение без пересушивания',
  },
  {
    id: 171234567,
    name: 'Крем-гель увлажняющий Normaderm',
    brand: 'Vichy',
    priceRub: 1250,
    category: 'moisturizer',
    description: 'Лёгкая текстура, матовый финиш',
  },
  {
    id: 188901234,
    name: 'Флюид Photoderm SPF 50+',
    brand: 'Bioderma',
    priceRub: 1490,
    category: 'spf',
    description: 'Ежедневная защита от солнца',
  },
  {
    id: 165432198,
    name: 'Мицеллярная вода для лица',
    brand: 'Garnier',
    priceRub: 420,
    category: 'micellar',
    description: 'Вечернее снятие SPF и загрязнений',
  },
  {
    id: 192345678,
    name: 'Сыворотка Resurfacing Retinol',
    brand: 'CeraVe',
    priceRub: 1680,
    category: 'retinol',
    description: 'Вечерний уход, старт 2 раза в неделю',
  },
];

export function wildberriesProductUrl(id: number): string {
  return `https://www.wildberries.ru/catalog/${id}/detail.aspx`;
}

export function matchProductCategory(step: string, productType: string): SkincareProductCategory | null {
  const text = `${step} ${productType}`.toLowerCase();
  if (/ретинол|актив|сыворот/.test(text)) return 'retinol';
  if (/spf|защит|солнц/.test(text)) return 'spf';
  if (/мицелл/.test(text)) return 'micellar';
  if (/увлажн|крем/.test(text)) return 'moisturizer';
  if (/очищен|умыван|гель|пенк/.test(text)) return 'cleanser';
  return null;
}

export type SkincareRoutineStep = {
  step: string;
  product_type: string;
  tip: string;
};

export type EnrichedSkincareStep = SkincareRoutineStep & {
  product: WildberriesProduct | null;
};

export function enrichSkincareRoutine(routine: SkincareRoutineStep[]): EnrichedSkincareStep[] {
  return routine.map((item) => {
    const category = matchProductCategory(item.step, item.product_type);
    const product = category
      ? SKINCARE_PRODUCT_CATALOG.find((p) => p.category === category) ?? null
      : null;
    return { ...item, product };
  });
}

export function getSkincarePreviewProducts(limit = 4): WildberriesProduct[] {
  return SKINCARE_PRODUCT_CATALOG.slice(0, limit);
}
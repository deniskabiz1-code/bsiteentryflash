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
  },
  {
    id: 1219734384,
    name: 'Пенка для умывания увлажняющая с гиалуроновой кислотой, 150 мл',
    brand: 'SYNERGETIC',
    priceRub: 250,
    category: 'cleanser_synergetic',
    store: 'ozon',
    description: 'Мягкое ежедневное очищение без стянутости',
  },
  {
    id: 309217385,
    name: 'Сыворотка для лица Азелаиновая кислота 10%',
    brand: 'Elementary',
    priceRub: 600,
    category: 'serum_azelaic',
    store: 'wildberries',
    description: 'Выравнивает тон и борется с постакне',
  },
  {
    id: 382239531,
    name: 'Сыворотка для проблемной кожи с азелоглицином, 35 мл',
    brand: 'SEVEKI',
    priceRub: 500,
    category: 'serum_azeloglicin',
    store: 'wildberries',
    description: 'Снижает жирность и покраснения',
  },
  {
    id: 142044104,
    name: 'Энзимная пудра пилинг для умывания лица и тела, 220 мл',
    brand: 'VOIS',
    priceRub: 500,
    category: 'cleanser_enzyme',
    store: 'wildberries',
    description: 'Деликатное отшелушивание 1–2 раза в неделю',
  },
  {
    id: 408376110,
    name: 'Матирующий крем для лица от прыщей и акне с ниацинамидом',
    brand: 'Orele',
    priceRub: 1200,
    category: 'moisturizer_orele',
    store: 'wildberries',
    description: 'Дневной уход с матовым финишем',
  },
  {
    id: 191806476,
    name: 'Сыворотка для лица с витамином С от пигментации и постакне',
    brand: 'Orele',
    priceRub: 1100,
    category: 'serum_vitc',
    store: 'wildberries',
    description: 'Осветление следов и ровный тон',
  },
  {
    id: 228767624,
    name: 'Пенка для умывания с травами увлажняющая от прыщей и сухости',
    brand: 'Orele',
    priceRub: 1100,
    category: 'cleanser_orele',
    store: 'wildberries',
    description: 'Очищение для проблемной и обезвоженной кожи',
  },
  {
    id: 2141553631,
    name: 'Сыворотка для ухода за кожей Восстановление, 30 мл',
    brand: 'KOEC lab',
    priceRub: 1000,
    category: 'serum_recovery',
    store: 'ozon',
    description: 'Восстановление барьера после активов',
  },
  {
    id: 696701797,
    name: 'Крем роллер для век и кожи вокруг глаз',
    brand: 'Kottur',
    priceRub: 350,
    category: 'eye_cream',
    store: 'wildberries',
    description: 'Уход за отёчностью и тёмными кругами',
  },
  {
    id: 1612315196,
    name: 'Крем для лица от прыщей с салициловой кислотой и ниацинамидом, 50 мл',
    brand: 'VOIS',
    priceRub: 300,
    category: 'moisturizer_vois',
    store: 'ozon',
    description: 'Лёгкий крем для проблемной кожи',
  },
];

export function skincareProductUrl(product: Pick<WildberriesProduct, 'id' | 'store'>): string {
  if (product.store === 'ozon') {
    return `https://www.ozon.ru/product/-${product.id}/`;
  }
  return `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`;
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
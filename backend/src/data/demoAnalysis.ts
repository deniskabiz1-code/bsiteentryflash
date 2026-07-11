/** Demo payloads when OPENAI_API_KEY is not configured. */

export const DEMO_FACE_RESULT = {
  overall_score: 72,
  scores: { skin: 68, jawline: 74, symmetry: 71, hairstyle: 75 },
  skin_type: 'combination',
  puffiness: 'medium',
  problem_zones: [
    { zone: 'Т-зона', description: 'Небольшая жирность в области лба и носа' },
    { zone: 'Подглазничная область', description: 'Лёгкая отёчность по утрам' },
  ],
  improvement_tips: [
    'Используйте SPF каждый день',
    'Добавьте ретинол в вечерний уход',
    'Пейте больше воды для снижения отёчности',
  ],
  growth_plan: [
    {
      step: 1,
      action: 'Внедрить базовый уход: очищение + увлажнение + SPF',
      timeline: '1–2 недели',
      progress_metric: 'Кожа менее сухая по утрам',
    },
    {
      step: 2,
      action: 'Добавить жевательную гимнастику 5 мин/день',
      timeline: '3–4 недели',
      progress_metric: 'Более чёткий контур нижней челюсти',
    },
    {
      step: 3,
      action: 'Сократить соль и алкоголь после 18:00',
      timeline: '2 недели',
      progress_metric: 'Меньше отёков на фото',
    },
    {
      step: 4,
      action: 'Обновить стрижку у барбера по рекомендациям',
      timeline: '1 визит',
      progress_metric: 'Причёска лучше подчёркивает форму лица',
    },
  ],
  skincare_routine: [
    { step: 'Утро: очищение', product_type: 'Мягкий гель для умывания', tip: 'Умывайтесь прохладной водой' },
    { step: 'Утро: увлажнение', product_type: 'Лёгкий крем-гель', tip: 'Наносите на влажную кожу' },
    { step: 'Утро: защита', product_type: 'SPF 30+', tip: 'Не забывайте про шею' },
    { step: 'Вечер: очищение', product_type: 'Гель + мицеллярная вода', tip: 'Двойное очищение при SPF' },
    { step: 'Вечер: актив', product_type: 'Ретинол 0.3%', tip: 'Начинайте 2 раза в неделю' },
  ],
} as const;

export const DEMO_HAIRSTYLE_RESULT = {
  face_shape: 'oval',
  best_haircuts: [
    { name: 'Текстурированный кроп', description: 'Подчёркивает скулы и линию челюсти' },
    { name: 'Фейд с чёлкой', description: 'Смягчает овальную форму лица' },
    { name: 'Сайд-парт', description: 'Классический вариант для офиса' },
  ],
  avoid: ['Длинные волосы без объёма', 'Прямая чёлка до бровей'],
  beard_recommendation: {
    recommended: true,
    shape: 'Короткая щетина с акцентом на линию челюсти',
  },
  barber_brief:
    'Овальное лицо. Нужен текстурированный кроп с умеренным фейдом, объём сверху, короткие виски.',
} as const;

const DEMO_DELAY_MS = 1400;

export function demoDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));
}
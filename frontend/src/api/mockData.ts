import { FaceAnalysisResult } from '@/types';

export const MOCK_USER = {
  id: 1,
  telegramId: '123456789',
  username: 'denis',
  name: 'Денис',
  age: 25,
  goals: ['skin', 'face', 'style'],
  referralCode: 'PRIME123',
  referralCredits: 1,
  subscriptionActive: true,
  subscriptionEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
  reminderEnabled: true,
  reminderTime: '09:00',
  reminderTimezone: 'Europe/Moscow',
  personalizedAnalysis: true,
  onboarded: true,
  faceAnalysisCount: 3,
  freeAnalysisAvailable: false,
};

export const MOCK_FACE_RESULT: FaceAnalysisResult = {
  overall_score: 64,
  summary:
    'Комбинированная кожа с жирной Т-зоной. Линия челюсти — сильная сторона, кожа и причёска тянут балл вниз.',
  strengths: [
    'Линия челюсти выглядит чётко (71/100)',
    'Симметрия в хорошем балансе (66/100)',
  ],
  priority_focus: 'На 2 недели: кожа — очищение Т-зоны + SPF каждый день.',
  quick_wins: [
    { action: '2 л воды и меньше соли после 18:00', impact: 'Меньше отёков под глазами' },
    { action: 'Селфи у окна, камера на уровне глаз', impact: 'Стабильнее баллы' },
  ],
  photo_feedback: 'Свет плоский — на следующем фото встаньте к окну лицом.',
  hair_notes: 'Текстурный кроп с объёмом сверху подтянет оценку причёски.',
  scores: { skin: 58, jawline: 71, symmetry: 66, hairstyle: 62 },
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
    { step: 1, action: 'Внедрить базовый уход: очищение + увлажнение + SPF', timeline: '1–2 недели', progress_metric: 'Кожа менее сухая по утрам' },
    { step: 2, action: 'Добавить жевательную гимнастику 5 мин/день', timeline: '3–4 недели', progress_metric: 'Более чёткий контур нижней челюсти' },
    { step: 3, action: 'Сократить соль и алкоголь после 18:00', timeline: '2 недели', progress_metric: 'Меньше отёков на фото' },
    { step: 4, action: 'Обновить стрижку у барбера по рекомендациям', timeline: '1 визит', progress_metric: 'Причёска лучше подчёркивает форму лица' },
  ],
  skincare_routine: [
    {
      step: 'Утро: очищение',
      product_id: 228767624,
      product_type: 'Orele пенка — бережно очищает Т-зону без пересушивания щёк',
      tip: 'Умывайтесь прохладной водой',
    },
    {
      step: 'Утро: сыворотка',
      product_id: 382239531,
      product_type: 'SEVEKI — снижает жирность и покраснения в Т-зоне',
      tip: 'Тонким слоем на Т-зону',
    },
    {
      step: 'Утро: увлажнение',
      product_id: 408376110,
      product_type: 'Orele матирующий крем — дневной уход при жирности',
      tip: 'Наносите на влажную кожу',
    },
    {
      step: 'Вечер: очищение',
      product_id: 142044104,
      product_type: 'VOIS энзимная пудра — мягкое отшелушивание 1–2 раза в неделю',
      tip: 'Заменяет пенку в дни отшелушивания',
    },
    {
      step: 'Вечер: активный уход',
      product_id: 309217385,
      product_type: 'Elementary азелаиновая кислота — для ровного тона',
      tip: 'Начните через день',
    },
  ],
};

const photo = (n: number) =>
  `https://i.pravatar.cc/300?img=${n}`;

export const MOCK_ANALYSES = [
  {
    id: 3,
    type: 'face' as const,
    photoUrl: photo(12),
    overallScore: 81,
    resultJson: {
      ...MOCK_FACE_RESULT,
      overall_score: 81,
      scores: { skin: 76, jawline: 88, symmetry: 84, hairstyle: 77 },
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    type: 'face' as const,
    photoUrl: photo(33),
    overallScore: 64,
    resultJson: MOCK_FACE_RESULT,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 1,
    type: 'face' as const,
    photoUrl: photo(57),
    overallScore: 53,
    resultJson: {
      ...MOCK_FACE_RESULT,
      overall_score: 53,
      scores: { skin: 49, jawline: 58, symmetry: 55, hairstyle: 51 },
    },
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
];

export const MOCK_DAILY_TASKS = {
  streak: 5,
  dailyTip: 'Пейте не менее 2 литров воды в день — это улучшает тонус кожи и снижает отёчность.',
  tasks: [
    { category: 'skin', label: '💧 Кожа', tasks: [
      { key: 'skin_wash_morning', label: 'Умыться утром с мягким гелем', completed: true },
      { key: 'skin_moisturize', label: 'Нанести увлажняющий крем', completed: true },
      { key: 'skin_spf', label: 'Нанести SPF 30+', completed: false },
      { key: 'skin_wash_evening', label: 'Вечернее умывание', completed: false },
    ]},
    { category: 'jawline', label: '💪 Линия челюсти', tasks: [
      { key: 'jawline_chew', label: '5 мин жевательной гимнастики', completed: true },
      { key: 'jawline_posture', label: 'Держать подбородок параллельно полу', completed: false },
    ]},
    { category: 'puffiness', label: '😴 Отёчность', tasks: [
      { key: 'puffiness_water', label: 'Выпить 2 л воды', completed: false },
      { key: 'puffiness_salt', label: 'Ограничить соль после 18:00', completed: true },
      { key: 'puffiness_sleep', label: 'Спать на спине', completed: false },
    ]},
    { category: 'hair', label: '✂️ Волосы/стрижка', tasks: [
      { key: 'hair_style', label: 'Уложить волосы аккуратно', completed: true },
    ]},
    { category: 'symmetry', label: '⚖️ Симметрия', tasks: [
      { key: 'symmetry_massage', label: '2 мин массажа лица', completed: false },
    ]},
  ],
  neverDo: [
    'Выдавливать прыщи и чёрные точки',
    'Спать лицом в подушку каждую ночь',
    'Умываться горячей водой',
    'Пропускать SPF даже зимой',
    'Трогать лицо грязными руками',
  ],
  allCompletedToday: false,
};
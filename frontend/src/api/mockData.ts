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
  onboarded: true,
  faceAnalysisCount: 3,
  freeAnalysisAvailable: false,
};

export const MOCK_FACE_RESULT: FaceAnalysisResult = {
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
    { step: 1, action: 'Внедрить базовый уход: очищение + увлажнение + SPF', timeline: '1–2 недели', progress_metric: 'Кожа менее сухая по утрам' },
    { step: 2, action: 'Добавить жевательную гимнастику 5 мин/день', timeline: '3–4 недели', progress_metric: 'Более чёткий контур нижней челюсти' },
    { step: 3, action: 'Сократить соль и алкоголь после 18:00', timeline: '2 недели', progress_metric: 'Меньше отёков на фото' },
    { step: 4, action: 'Обновить стрижку у барбера по рекомендациям', timeline: '1 визит', progress_metric: 'Причёска лучше подчёркивает форму лица' },
  ],
  skincare_routine: [
    { step: 'Утро: очищение', product_type: 'Мягкий гель для умывания', tip: 'Умывайтесь прохладной водой' },
    { step: 'Утро: увлажнение', product_type: 'Лёгкий крем-гель', tip: 'Наносите на влажную кожу' },
    { step: 'Утро: защита', product_type: 'SPF 30+', tip: 'Не забывайте про шею' },
    { step: 'Вечер: очищение', product_type: 'Гель + мицеллярная вода', tip: 'Двойное очищение при SPF' },
    { step: 'Вечер: актив', product_type: 'Ретинол 0.3%', tip: 'Начинайте 2 раза в неделю' },
  ],
};

const photo = (n: number) =>
  `https://i.pravatar.cc/300?img=${n}`;

export const MOCK_ANALYSES = [
  { id: 3, type: 'face' as const, photoUrl: photo(12), overallScore: 72, resultJson: MOCK_FACE_RESULT, createdAt: new Date().toISOString() },
  { id: 2, type: 'face' as const, photoUrl: photo(33), overallScore: 68, resultJson: { ...MOCK_FACE_RESULT, overall_score: 68 }, createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 1, type: 'face' as const, photoUrl: photo(57), overallScore: 64, resultJson: { ...MOCK_FACE_RESULT, overall_score: 64 }, createdAt: new Date(Date.now() - 21 * 86400000).toISOString() },
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
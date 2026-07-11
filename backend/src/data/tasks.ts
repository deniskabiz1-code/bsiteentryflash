export interface DailyTask {
  key: string;
  category: 'skin' | 'jawline' | 'puffiness' | 'hair' | 'symmetry';
  label: string;
}

export const DAILY_TASKS: DailyTask[] = [
  { key: 'skin_wash_morning', category: 'skin', label: 'Умыться утром с мягким гелем' },
  { key: 'skin_moisturize', category: 'skin', label: 'Нанести увлажняющий крем' },
  { key: 'skin_spf', category: 'skin', label: 'Нанести SPF 30+' },
  { key: 'skin_wash_evening', category: 'skin', label: 'Вечернее умывание' },
  { key: 'jawline_chew', category: 'jawline', label: '5 мин жевательной гимнастики' },
  { key: 'jawline_posture', category: 'jawline', label: 'Держать подбородок параллельно полу' },
  { key: 'puffiness_water', category: 'puffiness', label: 'Выпить 2 л воды' },
  { key: 'puffiness_salt', category: 'puffiness', label: 'Ограничить соль после 18:00' },
  { key: 'puffiness_sleep', category: 'puffiness', label: 'Спать на спине' },
  { key: 'hair_style', category: 'hair', label: 'Уложить волосы аккуратно' },
  { key: 'symmetry_massage', category: 'symmetry', label: '2 мин массажа лица' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  skin: '💧 Кожа',
  jawline: '💪 Линия челюсти',
  puffiness: '😴 Отёчность',
  hair: '✂️ Волосы/стрижка',
  symmetry: '⚖️ Симметрия',
};

export const NEVER_DO_LIST = [
  'Выдавливать прыщи и чёрные точки',
  'Спать лицом в подушку каждую ночь',
  'Умываться горячей водой',
  'Пропускать SPF даже зимой',
  'Трогать лицо грязными руками',
  'Использовать агрессивные скрабы каждый день',
  'Забывать смывать средства перед сном',
  'Резко менять всю рутину ухода сразу',
  'Игнорировать аллергические реакции на продукты',
  'Сравнивать себя с отфотошопленными фото',
];
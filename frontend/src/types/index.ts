export interface User {
  id: number;
  telegramId: string;
  username: string | null;
  name: string | null;
  age: number | null;
  goals: string[];
  referralCode: string;
  referralCredits: number;
  subscriptionActive: boolean;
  subscriptionEnd: string | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
  reminderTimezone: string | null;
  personalizedAnalysis: boolean;
  onboarded: boolean;
  faceAnalysisCount: number;
  freeAnalysisAvailable: boolean;
}

export interface FaceAnalysisResult {
  overall_score: number;
  summary?: string;
  strengths?: string[];
  priority_focus?: string;
  quick_wins?: { action: string; impact: string }[];
  photo_feedback?: string;
  hair_notes?: string;
  face_shape?: string;
  best_haircuts?: { name: string; description: string }[];
  haircuts_to_avoid?: string[];
  scores: {
    skin: number;
    jawline: number;
    symmetry: number;
    hairstyle: number;
  };
  skin_type: 'dry' | 'oily' | 'combination' | 'normal';
  puffiness: 'low' | 'medium' | 'high';
  problem_zones: { zone: string; description: string }[];
  improvement_tips: string[];
  growth_plan: {
    step: number;
    action: string;
    timeline: string;
    progress_metric: string;
  }[];
  skincare_routine: {
    step: string;
    product_id?: number;
    product_type: string;
    tip: string;
  }[];
  progress_vs_last?: {
    has_previous: boolean;
    overall_delta: number;
    summary: string;
    metric_deltas: {
      skin: number;
      jawline: number;
      symmetry: number;
      hairstyle: number;
    };
  };
}

export interface HairstyleResult {
  face_shape: string;
  best_haircuts: { name: string; description: string }[];
  avoid: string[];
  beard_recommendation: { recommended: boolean; shape: string };
  barber_brief: string;
}

export interface Analysis {
  id: number;
  type: 'face' | 'hairstyle';
  photoUrl: string;
  overallScore: number | null;
  resultJson: FaceAnalysisResult | HairstyleResult;
  demo?: boolean;
  createdAt: string;
}

export interface DailyTask {
  key: string;
  label: string;
  completed: boolean;
}

export interface TaskGroup {
  category: string;
  label: string;
  tasks: DailyTask[];
}

export const GOAL_LABELS: Record<string, string> = {
  skin: 'Кожа',
  face: 'Лицо',
  style: 'Стиль',
};

export const GOAL_OPTIONS = [
  {
    key: 'skin',
    title: 'Кожа',
    description: 'Прыщи, тон, уход и здоровый вид кожи',
  },
  {
    key: 'face',
    title: 'Лицо',
    description: 'Челюсть, симметрия и пропорции черт',
  },
  {
    key: 'style',
    title: 'Стиль',
    description: 'Причёска, борода и общий образ',
  },
] as const;

export const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: 'Сухая',
  oily: 'Жирная',
  combination: 'Комбинированная',
  normal: 'Нормальная',
};

export const PUFFINESS_LABELS: Record<string, string> = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
};

export const SCORE_LABELS: Record<string, string> = {
  skin: 'Кожа',
  jawline: 'Линия челюсти',
  symmetry: 'Симметрия',
  hairstyle: 'Причёска',
};

export const FACE_SHAPE_LABELS: Record<string, string> = {
  oval: 'Овальная',
  square: 'Квадратная',
  round: 'Круглая',
  heart: 'Сердцевидная',
  oblong: 'Вытянутая',
};
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
  onboarded: boolean;
  faceAnalysisCount: number;
}

export interface FaceAnalysisResult {
  overall_score: number;
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
    product_type: string;
    tip: string;
  }[];
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
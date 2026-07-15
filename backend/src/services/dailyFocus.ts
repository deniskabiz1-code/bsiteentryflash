import { createHash } from 'crypto';
import { User } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { CATEGORY_LABELS, DAILY_TASKS, DailyTask, NEVER_DO_LIST } from '../data/tasks';
import { getDailyTip } from '../data/dailyTips';

const MAX_FOCUS_TASKS = 5;
const STREAK_MIN_TASKS = 3;

type TaskCategory = DailyTask['category'];

const GOAL_CATEGORIES: Record<string, TaskCategory[]> = {
  skin: ['skin', 'puffiness'],
  face: ['jawline', 'symmetry', 'puffiness'],
  style: ['hair'],
};

export type FocusTask = {
  key: string;
  category: TaskCategory;
  label: string;
  fromAnalysis: boolean;
};

export type FocusTaskGroup = {
  category: string;
  label: string;
  tasks: { key: string; label: string; completed: boolean; fromAnalysis: boolean }[];
};

function taskKey(seed: string): string {
  const hash = createHash('sha256').update(seed.trim().toLowerCase()).digest('hex').slice(0, 16);
  return `focus_${hash}`;
}

function allowedCategories(goals: string[]): Set<TaskCategory> {
  const selected = goals.length > 0 ? goals : ['skin', 'face', 'style'];
  const cats = new Set<TaskCategory>();
  for (const goal of selected) {
    for (const cat of GOAL_CATEGORIES[goal] || []) {
      cats.add(cat);
    }
  }
  return cats;
}

function inferCategory(text: string): TaskCategory {
  const t = text.toLowerCase();
  if (/волос|стрижк|укладк|бород|пробор|фен/i.test(t)) return 'hair';
  if (/челюст|жеватель|подбородок|осанк|шея/i.test(t)) return 'jawline';
  if (/симметр|массаж/i.test(t)) return 'symmetry';
  if (/отёк|отек|вода|соль|спать|сон|подушк/i.test(t)) return 'puffiness';
  return 'skin';
}

function pickDailyTip(result: Record<string, unknown> | null): string {
  const quickWins = result?.quick_wins;
  if (Array.isArray(quickWins) && quickWins[0] && typeof quickWins[0] === 'object') {
    const win = quickWins[0] as { impact?: string; action?: string };
    if (win.impact?.trim()) return win.impact.trim();
    if (win.action?.trim()) return win.action.trim();
  }
  if (typeof result?.summary === 'string' && result.summary.trim()) {
    const sentence = result.summary.trim().split(/(?<=[.!?])\s+/)[0];
    return sentence || result.summary.trim();
  }
  return getDailyTip();
}

type FocusCandidate = FocusTask & { priority: number };

function extractAnalysisTasks(
  result: Record<string, unknown>,
  allowed: Set<TaskCategory>,
): FocusTask[] {
  const out: FocusCandidate[] = [];
  const seen = new Set<string>();

  const push = (label: string, priority: number) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const norm = trimmed.toLowerCase();
    if (seen.has(norm)) return;
    const category = inferCategory(trimmed);
    if (!allowed.has(category)) return;
    seen.add(norm);
    out.push({
      key: taskKey(trimmed),
      category,
      label: trimmed,
      fromAnalysis: true,
      priority,
    });
  };

  const quickWins = result.quick_wins;
  if (Array.isArray(quickWins)) {
    for (const item of quickWins.slice(0, 2)) {
      if (item && typeof item === 'object' && typeof (item as { action?: string }).action === 'string') {
        push((item as { action: string }).action, 1);
      }
    }
  }

  const tips = result.improvement_tips;
  if (Array.isArray(tips)) {
    for (const tip of tips.slice(0, 2)) {
      if (typeof tip === 'string') push(tip, 2);
    }
  }

  const plan = result.growth_plan;
  if (Array.isArray(plan) && plan[0] && typeof plan[0] === 'object') {
    const action = (plan[0] as { action?: string }).action;
    if (typeof action === 'string') push(action, 3);
  }

  return out
    .sort((a, b) => a.priority - b.priority)
    .map(({ priority: _priority, ...task }) => task);
}

function fillFromCatalog(
  existing: FocusTask[],
  allowed: Set<TaskCategory>,
): FocusTask[] {
  const seen = new Set(existing.map((t) => t.label.toLowerCase()));
  const filled = [...existing];

  for (const item of DAILY_TASKS) {
    if (filled.length >= MAX_FOCUS_TASKS) break;
    if (!allowed.has(item.category)) continue;
    if (seen.has(item.label.toLowerCase())) continue;
    filled.push({ ...item, fromAnalysis: false });
    seen.add(item.label.toLowerCase());
  }

  return filled.slice(0, MAX_FOCUS_TASKS);
}

export function buildDailyFocusTasks(
  user: User,
  analysisResult: Record<string, unknown> | null,
): FocusTask[] {
  const allowed = allowedCategories(user.goals);
  const fromAnalysis = analysisResult
    ? extractAnalysisTasks(analysisResult, allowed)
    : [];

  return fillFromCatalog(fromAnalysis, allowed);
}

export function groupFocusTasks(
  tasks: FocusTask[],
  completedKeys: Set<string>,
): FocusTaskGroup[] {
  const order: TaskCategory[] = ['skin', 'jawline', 'puffiness', 'hair', 'symmetry'];
  const groups: FocusTaskGroup[] = [];

  for (const category of order) {
    const categoryTasks = tasks.filter((t) => t.category === category);
    if (categoryTasks.length === 0) continue;
    groups.push({
      category,
      label: CATEGORY_LABELS[category],
      tasks: categoryTasks.map((t) => ({
        key: t.key,
        label: t.label,
        fromAnalysis: t.fromAnalysis,
        completed: completedKeys.has(t.key),
      })),
    });
  }

  return groups;
}

export async function getLatestFaceAnalysis(userId: number) {
  return prisma.analysis.findFirst({
    where: { userId, type: 'face' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function calculateFocusStreak(userId: number): Promise<number> {
  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const completed = await prisma.taskCompletion.count({
      where: { userId, date: checkDate },
    });

    if (completed >= STREAK_MIN_TASKS) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export function isValidFocusTaskKey(taskKey: string): boolean {
  return taskKey.startsWith('focus_') || DAILY_TASKS.some((t) => t.key === taskKey);
}

export async function buildDailyFocusResponse(user: User, today: Date) {
  const latest = await getLatestFaceAnalysis(user.id);
  const result = (latest?.resultJson as Record<string, unknown> | null) ?? null;
  const focusTasks = buildDailyFocusTasks(user, result);

  const completions = await prisma.taskCompletion.findMany({
    where: { userId: user.id, date: today },
  });
  const completedKeys = new Set(completions.map((c) => c.taskKey));

  const grouped = groupFocusTasks(focusTasks, completedKeys);
  const streak = await calculateFocusStreak(user.id);
  const completedToday = focusTasks.filter((t) => completedKeys.has(t.key)).length;
  const analysisSourced = focusTasks.filter((t) => t.fromAnalysis).length;

  return {
    streak,
    dailyTip: pickDailyTip(result),
    tasks: grouped,
    neverDo: NEVER_DO_LIST,
    allCompletedToday: focusTasks.length > 0 && completedToday >= focusTasks.length,
    focusMeta: {
      total: focusTasks.length,
      fromAnalysis: analysisSourced,
      analysisDate: latest?.createdAt?.toISOString() ?? null,
    },
  };
}
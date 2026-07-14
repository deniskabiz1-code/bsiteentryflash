const SCORE_LABELS: Record<string, string> = {
  skin: 'кожа',
  jawline: 'линия челюсти',
  symmetry: 'симметрия',
  hairstyle: 'причёска',
};

type QuickWin = { action: string; impact: string };

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function scoreEntries(scores: unknown): [string, number][] {
  if (!scores || typeof scores !== 'object') return [];
  return Object.entries(scores as Record<string, unknown>)
    .map(([key, value]) => [key, typeof value === 'number' ? value : Number(value)] as [string, number])
    .filter(([, value]) => Number.isFinite(value));
}

function buildFallbackSummary(data: Record<string, unknown>): string {
  const skinType = asString(data.skin_type) ?? 'combination';
  const puffiness = asString(data.puffiness) ?? 'medium';
  const zones = Array.isArray(data.problem_zones)
    ? (data.problem_zones as { zone?: string }[]).map((z) => z.zone).filter(Boolean)
    : [];

  const zoneText = zones.length ? ` Основные зоны внимания: ${zones.join(', ')}.` : '';
  return `На фото видна ${skinType === 'combination' ? 'комбинированная' : skinType} кожа с ${puffiness === 'high' ? 'заметной' : 'умеренной'} отёчностью.${zoneText} Сфокусируйтесь на стабильном уходе и одинаковых условиях съёмки для точного прогресса.`;
}

function buildFallbackStrengths(scores: unknown): string[] {
  const entries = scoreEntries(scores).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 3).filter(([, value]) => value >= 60);
  if (top.length === 0) {
    return ['Есть база для улучшения — начните с простого ежедневного ухода'];
  }
  return top.map(([key, value]) => {
    const label = SCORE_LABELS[key] ?? key;
    if (value >= 82) return `${label.charAt(0).toUpperCase() + label.slice(1)} — явная сильная сторона (${value}/100)`;
    if (value >= 72) return `${label.charAt(0).toUpperCase() + label.slice(1)} выглядит хорошо (${value}/100)`;
    return `${label.charAt(0).toUpperCase() + label.slice(1)} — относительно лучший параметр (${value}/100)`;
  });
}

function buildFallbackPriorityFocus(data: Record<string, unknown>): string {
  const entries = scoreEntries(data.scores).sort((a, b) => a[1] - b[1]);
  const weakest = entries[0];
  if (!weakest) {
    return 'Закрепите базовый уход: очищение утром и вечером + ежедневный SPF.';
  }
  const [key, value] = weakest;
  const label = SCORE_LABELS[key] ?? key;
  if (key === 'skin') {
    return `Приоритет на 2 недели: кожа (${value}/100) — выровняйте очищение и увлажнение, не пропускайте SPF.`;
  }
  if (key === 'jawline') {
    return `Приоритет на 2 недели: линия челюсти (${value}/100) — жевательная гимнастика 5 мин/день и контроль осанки.`;
  }
  if (key === 'hairstyle') {
    return `Приоритет на 2 недели: причёска (${value}/100) — обновите стрижку под форму лица и ежедневную укладку.`;
  }
  return `Приоритет на 2 недели: ${label} (${value}/100) — сфокусируйтесь на этом параметре в ближайших чек-инах.`;
}

function buildFallbackQuickWins(data: Record<string, unknown>): QuickWin[] {
  const wins: QuickWin[] = [];
  const puffiness = asString(data.puffiness);

  if (puffiness === 'medium' || puffiness === 'high') {
    wins.push({
      action: 'Пейте 2 л воды и ограничьте соль после 18:00',
      impact: 'Снижает утреннюю отёчность на фото',
    });
  }

  wins.push({
    action: 'Следующее селфи — при дневном свете у окна, камера на уровне глаз',
    impact: 'Баллы станут стабильнее между анализами',
  });

  const tips = asStringArray(data.improvement_tips);
  if (tips[0]) {
    wins.push({
      action: tips[0],
      impact: 'Быстрый шаг из персональных рекомендаций',
    });
  }

  return wins.slice(0, 3);
}

function buildFallbackPhotoFeedback(): string {
  return 'Для более точного сравнения снимайтесь при ровном свете, держите камеру на уровне глаз и не наклоняйте голову сильно в сторону.';
}

function buildFallbackHairNotes(scores: unknown): string {
  const hairstyle = scoreEntries(scores).find(([key]) => key === 'hairstyle')?.[1];
  if (hairstyle === undefined) {
    return 'Причёска влияет на общее впечатление — аккуратная укладка и свежая стрижка могут поднять оценку на следующем фото.';
  }
  if (hairstyle >= 75) {
    return 'Причёска хорошо подчёркивает лицо — сохраняйте текущую форму и объём.';
  }
  if (hairstyle >= 60) {
    return 'Причёска нейтральная — текстурный кроп или лёгкий объём сверху визуально улучшат пропорции.';
  }
  return 'Причёска сейчас тянет оценку вниз — стоит обновить стрижку и уделять 2–3 минуты укладке перед фото.';
}

function normalizeQuickWins(raw: unknown, data: Record<string, unknown>): QuickWin[] {
  if (!Array.isArray(raw)) return buildFallbackQuickWins(data);

  const wins = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const action = asString(record.action);
      const impact = asString(record.impact);
      if (!action || !impact) return null;
      return { action, impact };
    })
    .filter((item): item is QuickWin => Boolean(item));

  return wins.length > 0 ? wins.slice(0, 4) : buildFallbackQuickWins(data);
}

export function enrichAnalysisInsights(data: Record<string, unknown>): Record<string, unknown> {
  return {
    ...data,
    summary: asString(data.summary) ?? buildFallbackSummary(data),
    strengths: (() => {
      const strengths = asStringArray(data.strengths);
      return strengths.length > 0 ? strengths.slice(0, 4) : buildFallbackStrengths(data.scores);
    })(),
    priority_focus: asString(data.priority_focus) ?? buildFallbackPriorityFocus(data),
    quick_wins: normalizeQuickWins(data.quick_wins, data),
    photo_feedback: asString(data.photo_feedback) ?? buildFallbackPhotoFeedback(),
    hair_notes: asString(data.hair_notes) ?? buildFallbackHairNotes(data.scores),
  };
}
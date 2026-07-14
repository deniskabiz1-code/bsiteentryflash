const SCORE_LABELS: Record<string, string> = {
  skin: 'кожа',
  jawline: 'линия челюсти',
  symmetry: 'симметрия',
  hairstyle: 'причёска',
};

type QuickWin = { action: string; impact: string };
type HaircutPick = { name: string; description: string };

const VALID_FACE_SHAPES = new Set(['oval', 'square', 'round', 'heart', 'oblong']);

const HAIRCUTS_BY_FACE_SHAPE: Record<string, { best: HaircutPick[]; avoid: string[] }> = {
  oval: {
    best: [
      { name: 'Текстурированный кроп', description: 'Подчёркивает скулы и линию челюсти — универсален для овала' },
      { name: 'Фейд с чёлкой', description: 'Смягчает пропорции и добавляет объём сверху' },
      { name: 'Сайд-парт', description: 'Классика, которая не перегружает овальное лицо' },
    ],
    avoid: ['Длинные волосы без объёма', 'Прямая густая чёлка до бровей'],
  },
  square: {
    best: [
      { name: 'Кроп с текстурой сверху', description: 'Смягчает угловатую челюсть, добавляет высоту' },
      { name: 'Высокий фейд', description: 'Удлиняет лицо и убирает лишнюю массивность по бокам' },
      { name: 'Ёжик с затуханием', description: 'Балансирует широкую челюсть и подчёркивает скулы' },
    ],
    avoid: ['Ровный бой с акцентом на ширину', 'Чёлка в лоб до бровей'],
  },
  round: {
    best: [
      { name: 'Помпадур / объём сверху', description: 'Визуально вытягивает круглое лицо' },
      { name: 'Низкий фейд с длиной сверху', description: 'Создаёт вертикаль и структуру' },
      { name: 'Квифф', description: 'Добавляет высоту и делает лицо более вытянутым' },
    ],
    avoid: ['Округлая форма без объёма сверху', 'Длинные волосы по бокам'],
  },
  heart: {
    best: [
      { name: 'Средняя длина с объёмом у подбородка', description: 'Балансирует широкий лоб и узкий подбородок' },
      { name: 'Текстурированный кроп без чёлки', description: 'Не акцентирует верхнюю часть лица' },
      { name: 'Сайд-свип', description: 'Смещает фокус с лба на скулы' },
    ],
    avoid: ['Высокий объём на макушке', 'Густая прямая чёлка'],
  },
  oblong: {
    best: [
      { name: 'Кроп с чёлкой', description: 'Визуально укорачивает вытянутое лицо' },
      { name: 'Средний фейд с боковым пробором', description: 'Добавляет ширину и смягчает длину' },
      { name: 'Текстурный кроп без высоты', description: 'Не удлиняет лицо дополнительно' },
    ],
    avoid: ['Высокий помпадур', 'Длинные волосы с центральным пробором'],
  },
};

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

function resolveFaceShape(data: Record<string, unknown>): string {
  const raw = asString(data.face_shape)?.toLowerCase();
  if (raw && VALID_FACE_SHAPES.has(raw)) return raw;
  return 'oval';
}

function normalizeHaircuts(raw: unknown): HaircutPick[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const name = asString(record.name);
      const description = asString(record.description);
      if (!name || !description) return null;
      return { name, description };
    })
    .filter((item): item is HaircutPick => Boolean(item))
    .slice(0, 3);
}

function buildFallbackHaircuts(data: Record<string, unknown>): {
  face_shape: string;
  best_haircuts: HaircutPick[];
  haircuts_to_avoid: string[];
} {
  const face_shape = resolveFaceShape(data);
  const preset = HAIRCUTS_BY_FACE_SHAPE[face_shape] ?? HAIRCUTS_BY_FACE_SHAPE.oval;
  return {
    face_shape,
    best_haircuts: preset.best,
    haircuts_to_avoid: preset.avoid,
  };
}

export function enrichAnalysisInsights(data: Record<string, unknown>): Record<string, unknown> {
  const haircutFallback = buildFallbackHaircuts(data);
  const best_haircuts = normalizeHaircuts(data.best_haircuts);
  const haircuts_to_avoid = asStringArray(data.haircuts_to_avoid);

  return {
    ...data,
    summary: asString(data.summary) ?? buildFallbackSummary(data),
    strengths: (() => {
      const strengths = asStringArray(data.strengths);
      return strengths.length > 0 ? strengths.slice(0, 4) : buildFallbackStrengths(data.scores);
    })(),
    quick_wins: normalizeQuickWins(data.quick_wins, data),
    photo_feedback: asString(data.photo_feedback) ?? buildFallbackPhotoFeedback(),
    hair_notes: asString(data.hair_notes) ?? buildFallbackHairNotes(data.scores),
    face_shape: resolveFaceShape(data),
    best_haircuts: best_haircuts.length > 0 ? best_haircuts : haircutFallback.best_haircuts,
    haircuts_to_avoid:
      haircuts_to_avoid.length > 0 ? haircuts_to_avoid.slice(0, 3) : haircutFallback.haircuts_to_avoid,
  };
}
import type { LessonResult, LocalStats } from "../types/stats";

const STORAGE_KEY = "staqtype:stats:v1";
const MAX_STORED_RESULTS = 100;

export function emptyStats(): LocalStats {
  return {
    totalTypedCharacters: 0,
    totalErrors: 0,
    lessonResults: [],
    charErrors: {},
  };
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asCharCounts(value: unknown): Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const counts: Record<string, number> = {};
  for (const [key, count] of Object.entries(value)) {
    if (typeof count === "number" && Number.isFinite(count) && count > 0) {
      counts[key] = count;
    }
  }
  return counts;
}

/** Coerces untrusted data (storage, imported files) into a valid LocalStats. */
export function sanitizeStats(value: unknown): LocalStats {
  const parsed = (
    typeof value === "object" && value !== null ? value : {}
  ) as Partial<LocalStats>;
  return {
    totalTypedCharacters: asNumber(parsed.totalTypedCharacters),
    totalErrors: asNumber(parsed.totalErrors),
    lessonResults: Array.isArray(parsed.lessonResults)
      ? (parsed.lessonResults as LessonResult[])
      : [],
    charErrors: asCharCounts(parsed.charErrors),
  };
}

export function loadStats(): LocalStats {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStats();
    }
    return sanitizeStats(JSON.parse(raw));
  } catch {
    // Corrupted or inaccessible storage: start fresh instead of crashing.
    return emptyStats();
  }
}

export function saveStats(stats: LocalStats): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage may be full or blocked (private mode); stats stay in memory.
  }
}

/** Pure aggregation of a finished lesson into the stored stats. */
export function applyResult(
  stats: LocalStats,
  result: LessonResult,
): LocalStats {
  const charErrors = { ...stats.charErrors };
  for (const [char, count] of Object.entries(result.missedChars ?? {})) {
    charErrors[char] = (charErrors[char] ?? 0) + count;
  }
  return {
    totalTypedCharacters: stats.totalTypedCharacters + result.typedCharacters,
    totalErrors: stats.totalErrors + result.errors,
    lessonResults: [...stats.lessonResults, result].slice(-MAX_STORED_RESULTS),
    charErrors,
  };
}

/** Best WPM per lesson id over the stored runs. */
export function bestWpmByLesson(results: LessonResult[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const r of results) {
    best.set(r.lessonId, Math.max(best.get(r.lessonId) ?? 0, r.wpm));
  }
  return best;
}

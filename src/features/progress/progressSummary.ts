import type { LanguageId } from "../../data/languages";
import { LANGUAGE_IDS } from "../../data/languages";
import type { Lesson } from "../../types/lesson";
import type { LessonResult, LocalStats } from "../../types/stats";

export type LanguageProgress = {
  language: LanguageId;
  lessons: number;
  /** Lessons with at least one finished run. */
  typed: number;
  /** Mean WPM over this language's stored runs; 0 when there are none. */
  avgWpm: number;
  bestWpm: number;
};

export type RecentRun = {
  result: LessonResult;
  lesson: Lesson | undefined;
};

export type ProgressSummary = {
  sessions: number;
  avgWpm: number;
  bestWpm: number;
  /** Accuracy over every keystroke ever typed, in percent. */
  accuracy: number;
  timeMs: number;
  /** WPM of the last runs, oldest first, for the chart. */
  wpmHistory: number[];
  byLanguage: LanguageProgress[];
  /** Most missed expected characters, most frequent first. */
  missedKeys: [string, number][];
  /** Latest runs, newest first. */
  recent: RecentRun[];
};

const HISTORY_LENGTH = 30;
const MISSED_KEYS = 8;
const RECENT_RUNS = 5;

function mean(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Everything the Progress page shows, derived from the stored stats.
 * Results for lessons that no longer exist still count towards the totals
 * but not towards any language.
 */
export function summarizeProgress(
  stats: LocalStats,
  lessons: Lesson[],
): ProgressSummary {
  const results = stats.lessonResults;
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const typedChars = stats.totalTypedCharacters;

  const byLanguage = LANGUAGE_IDS.map((language): LanguageProgress => {
    const languageLessons = lessons.filter((l) => l.language === language);
    const ids = new Set(languageLessons.map((l) => l.id));
    const runs = results.filter((r) => ids.has(r.lessonId));
    return {
      language,
      lessons: languageLessons.length,
      typed: new Set(runs.map((r) => r.lessonId)).size,
      avgWpm: mean(runs.map((r) => r.wpm)),
      bestWpm: runs.reduce((best, r) => Math.max(best, r.wpm), 0),
    };
  })
    .filter((row) => row.lessons > 0)
    .sort(
      (a, b) => b.typed / b.lessons - a.typed / a.lessons || b.lessons - a.lessons,
    );

  return {
    sessions: results.length,
    avgWpm: mean(results.map((r) => r.wpm)),
    bestWpm: results.reduce((best, r) => Math.max(best, r.wpm), 0),
    accuracy:
      typedChars > 0
        ? Math.max(0, ((typedChars - stats.totalErrors) / typedChars) * 100)
        : 0,
    timeMs: results.reduce((sum, r) => sum + r.elapsedMs, 0),
    wpmHistory: results.slice(-HISTORY_LENGTH).map((r) => r.wpm),
    byLanguage,
    missedKeys: Object.entries(stats.charErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MISSED_KEYS),
    recent: results
      .slice(-RECENT_RUNS)
      .reverse()
      .map((result) => ({ result, lesson: byId.get(result.lessonId) })),
  };
}

/** "today", "yesterday" or "N days ago", relative to `now`. */
export function formatDaysAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) {
    return "";
  }
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(then)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/** Hours and minutes, e.g. "4h 12m" or "18m". */
export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

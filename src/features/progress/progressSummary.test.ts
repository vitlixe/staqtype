import { describe, expect, it } from "vitest";
import type { Lesson } from "../../types/lesson";
import type { LessonResult } from "../../types/stats";
import { emptyStats, applyResult } from "../../utils/statsStorage";
import {
  formatDaysAgo,
  formatDuration,
  summarizeProgress,
} from "./progressSummary";

const lessons: Lesson[] = [
  { id: "b1", title: "Bash one", language: "bash", difficulty: "beginner", text: "ls" },
  { id: "b2", title: "Bash two", language: "bash", difficulty: "beginner", text: "pwd" },
  { id: "y1", title: "Yaml one", language: "yaml", difficulty: "beginner", text: "a: 1" },
];

function run(lessonId: string, wpm: number, extra: Partial<LessonResult> = {}): LessonResult {
  return {
    lessonId,
    completedAt: "2026-11-10T10:00:00Z",
    wpm,
    accuracy: 100,
    errors: 0,
    elapsedMs: 60_000,
    typedCharacters: 100,
    ...extra,
  };
}

describe("summarizeProgress", () => {
  it("returns zeros for empty stats", () => {
    const s = summarizeProgress(emptyStats(), lessons);
    expect(s.sessions).toBe(0);
    expect(s.avgWpm).toBe(0);
    expect(s.accuracy).toBe(0);
    expect(s.wpmHistory).toEqual([]);
    expect(s.recent).toEqual([]);
    expect(s.byLanguage.map((r) => [r.language, r.typed])).toEqual([
      ["bash", 0],
      ["yaml", 0],
    ]);
  });

  it("aggregates runs overall and per language", () => {
    let stats = emptyStats();
    stats = applyResult(stats, run("b1", 40, { errors: 5, missedChars: { ";": 3, "[": 2 } }));
    stats = applyResult(stats, run("b1", 60, { missedChars: { ";": 1 } }));
    stats = applyResult(stats, run("y1", 50));
    const s = summarizeProgress(stats, lessons);

    expect(s.sessions).toBe(3);
    expect(s.avgWpm).toBe(50);
    expect(s.bestWpm).toBe(60);
    expect(s.accuracy).toBeCloseTo((300 - 5) / 300 * 100);
    expect(s.timeMs).toBe(180_000);
    expect(s.wpmHistory).toEqual([40, 60, 50]);
    expect(s.missedKeys).toEqual([[";", 4], ["[", 2]]);
    expect(s.recent.map((r) => r.result.lessonId)).toEqual(["y1", "b1", "b1"]);

    const bash = s.byLanguage.find((r) => r.language === "bash")!;
    expect(bash).toMatchObject({ lessons: 2, typed: 1, avgWpm: 50, bestWpm: 60 });
    // yaml is fully typed (1/1), so it sorts above bash (1/2).
    expect(s.byLanguage[0].language).toBe("yaml");
  });

  it("keeps runs of unknown lessons in totals only", () => {
    const stats = applyResult(emptyStats(), run("gone", 70));
    const s = summarizeProgress(stats, lessons);
    expect(s.sessions).toBe(1);
    expect(s.recent[0].lesson).toBeUndefined();
    expect(s.byLanguage.every((r) => r.typed === 0)).toBe(true);
  });
});

describe("formatDaysAgo", () => {
  const now = new Date(2026, 10, 10, 15, 0);
  it("names today, yesterday and older days", () => {
    expect(formatDaysAgo(new Date(2026, 10, 10, 1, 0).toISOString(), now)).toBe("today");
    expect(formatDaysAgo(new Date(2026, 10, 9, 23, 0).toISOString(), now)).toBe("yesterday");
    expect(formatDaysAgo(new Date(2026, 10, 6, 12, 0).toISOString(), now)).toBe("4 days ago");
  });
  it("returns an empty string for invalid dates", () => {
    expect(formatDaysAgo("not a date", now)).toBe("");
  });
});

describe("formatDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(18 * 60_000)).toBe("18m");
    expect(formatDuration((4 * 60 + 12) * 60_000)).toBe("4h 12m");
  });
});

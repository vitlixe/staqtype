import { describe, expect, it } from "vitest";
import type { LessonResult } from "../types/stats";
import { applyResult, bestWpmByLesson, emptyStats } from "./statsStorage";

function result(overrides: Partial<LessonResult> = {}): LessonResult {
  return {
    lessonId: "dockerfile-node-service",
    completedAt: "2026-07-03T12:00:00.000Z",
    wpm: 42,
    accuracy: 96.5,
    errors: 3,
    elapsedMs: 60_000,
    typedCharacters: 210,
    ...overrides,
  };
}

describe("applyResult", () => {
  it("aggregates a first result into empty stats", () => {
    const stats = applyResult(emptyStats(), result());
    expect(stats.totalTypedCharacters).toBe(210);
    expect(stats.totalErrors).toBe(3);
    expect(stats.lessonResults).toHaveLength(1);
  });

  it("sums typed characters and errors", () => {
    const first = applyResult(emptyStats(), result());
    const second = applyResult(first, result({ typedCharacters: 90, errors: 7 }));
    expect(second.totalTypedCharacters).toBe(300);
    expect(second.totalErrors).toBe(10);
  });

  it("merges per-character miss counts across results", () => {
    const first = applyResult(
      emptyStats(),
      result({ missedChars: { ":": 2, "\n": 1 } }),
    );
    const second = applyResult(first, result({ missedChars: { ":": 1 } }));
    expect(second.charErrors).toEqual({ ":": 3, "\n": 1 });
  });

  it("tolerates results without miss data", () => {
    const stats = applyResult(emptyStats(), result());
    expect(stats.charErrors).toEqual({});
  });
});

describe("bestWpmByLesson", () => {
  it("keeps the best run per lesson", () => {
    const best = bestWpmByLesson([result({ lessonId: "b1", wpm: 40 }), result({ lessonId: "b1", wpm: 55 }), result({ lessonId: "y1", wpm: 30 })]);
    expect(best.get("b1")).toBe(55);
    expect(best.get("y1")).toBe(30);
    expect(best.has("b2")).toBe(false);
  });
});

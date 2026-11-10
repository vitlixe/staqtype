import { describe, expect, it } from "vitest";
import {
  calculateAccuracy,
  calculateWpm,
  countCorrectChars,
  formatTime,
} from "./typingMetrics";

describe("countCorrectChars", () => {
  it("counts exact positional matches", () => {
    expect(countCorrectChars("FROM node", "FROM node")).toBe(9);
    expect(countCorrectChars("FROM Node", "FROM node")).toBe(8);
  });

  it("is strict about whitespace and case", () => {
    expect(countCorrectChars("  web:", "\tweb:")).toBe(0);
    expect(countCorrectChars("services:\n", "services:\n")).toBe(10);
    expect(countCorrectChars("Services:", "services:")).toBe(8);
  });

  it("handles empty and partial input", () => {
    expect(countCorrectChars("", "target")).toBe(0);
    expect(countCorrectChars("tar", "target")).toBe(3);
  });

  it("ignores input beyond the target length", () => {
    expect(countCorrectChars("abcXY", "abc")).toBe(3);
  });
});

describe("calculateWpm", () => {
  it("uses correct chars / 5 / minutes", () => {
    expect(calculateWpm(50, 60_000)).toBe(10);
    expect(calculateWpm(250, 120_000)).toBe(25);
  });

  it("returns 0 for zero or negative elapsed time", () => {
    expect(calculateWpm(100, 0)).toBe(0);
    expect(calculateWpm(100, -5)).toBe(0);
  });

  it("returns 0 when nothing correct was typed", () => {
    expect(calculateWpm(0, 60_000)).toBe(0);
  });
});

describe("calculateAccuracy", () => {
  it("returns the percentage of correct characters", () => {
    expect(calculateAccuracy(90, 100)).toBe(90);
    expect(calculateAccuracy(1, 3)).toBeCloseTo(33.333, 2);
  });

  it("returns 100 when nothing was typed yet", () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });

  it("never exceeds 100 or drops below 0", () => {
    expect(calculateAccuracy(150, 100)).toBe(100);
    expect(calculateAccuracy(-5, 100)).toBe(0);
  });
});

describe("formatTime", () => {
  it("formats as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(9_000)).toBe("0:09");
    expect(formatTime(65_000)).toBe("1:05");
    expect(formatTime(600_000)).toBe("10:00");
  });

  it("clamps negative values to zero", () => {
    expect(formatTime(-1_000)).toBe("0:00");
  });

  it("floors partial seconds", () => {
    expect(formatTime(1_999)).toBe("0:01");
  });
});

import { describe, expect, it } from "vitest";
import { LANGUAGES } from "./languages";
import { lessons } from "./lessons";

describe("bundled lessons", () => {
  it("have unique ids", () => {
    const ids = lessons.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("use known languages", () => {
    for (const lesson of lessons) {
      expect(LANGUAGES, lesson.id).toHaveProperty(lesson.language);
    }
  });

  it("have clean text: no trailing whitespace, no CR, no edge newlines", () => {
    for (const lesson of lessons) {
      expect(lesson.text.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.text, lesson.id).not.toMatch(/\r/);
      expect(lesson.text, lesson.id).not.toMatch(/[ \t]+$/m);
      expect(lesson.text, lesson.id).not.toMatch(/^\n|\n$/);
    }
  });

  it("do not mix tab and space indentation inside one lesson", () => {
    for (const lesson of lessons) {
      const tabs = /^\t/m.test(lesson.text);
      const spaces = /^ +\S/m.test(lesson.text);
      expect(tabs && spaces, lesson.id).toBe(false);
    }
  });
});

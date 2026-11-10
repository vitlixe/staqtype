import { describe, expect, it } from "vitest";
import type { Lesson } from "../../types/lesson";
import { getTabInsertion, indentAt } from "./formatTypingText";

function lesson(text: string): Lesson {
  return { id: "x", title: "x", language: "go", difficulty: "beginner", text };
}

describe("getTabInsertion", () => {
  it("types a real tab for tab-indented lessons", () => {
    expect(getTabInsertion(lesson("func f() {\n\treturn\n}"), 4)).toBe("\t");
  });
  it("types the configured number of spaces otherwise", () => {
    expect(getTabInsertion(lesson("a:\n  b: 1"))).toBe("  ");
    expect(getTabInsertion(lesson("a:\n  b: 1"), 4)).toBe("    ");
  });
});

describe("indentAt", () => {
  it("returns the leading whitespace of a line", () => {
    const text = "spec:\n    replicas: 3\n\tx";
    expect(indentAt(text, 6)).toBe("    ");
    expect(indentAt(text, text.indexOf("\tx"))).toBe("\t");
    expect(indentAt(text, 0)).toBe("");
    expect(indentAt(text, text.length)).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { countLines, displayChar, keyLabel } from "./text";

describe("countLines", () => {
  it("counts lines", () => {
    expect(countLines("a")).toBe(1);
    expect(countLines("a\nb\n\nc")).toBe(4);
  });
});

describe("displayChar and keyLabel", () => {
  it("show whitespace as visible symbols", () => {
    expect([" ", "\t", "\n", "x"].map(displayChar)).toEqual(["·", "⇥", "↵", "x"]);
    expect([" ", "\t", "\n", "x"].map(keyLabel)).toEqual(["␣", "⇥", "↵", "x"]);
  });
});

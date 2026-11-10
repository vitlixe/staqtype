import { describe, expect, it } from "vitest";
import { processInput } from "./processInput";

const TARGET = "FROM node\nRUN npm ci";

describe("processInput (normal mode)", () => {
  it("commits correct keystrokes and counts them", () => {
    expect(processInput("FRO", "FROM", TARGET, false)).toEqual({
      next: "FROM",
      typedDelta: 1,
      errorDelta: 0,
      missedTargetChars: [],
    });
  });

  it("commits wrong keystrokes, counts errors and records the missed char", () => {
    expect(processInput("FRO", "FROx", TARGET, false)).toEqual({
      next: "FROx",
      typedDelta: 1,
      errorDelta: 1,
      missedTargetChars: ["M"],
    });
  });

  it("counts a multi-char insertion character by character", () => {
    // Toolbar Tab inserts two spaces where the target expects "M ": the
    // first space is wrong, the second lands on the target's real space.
    expect(processInput("FRO", "FRO  ", TARGET, false)).toEqual({
      next: "FRO  ",
      typedDelta: 2,
      errorDelta: 1,
      missedTargetChars: ["M"],
    });
  });

  it("treats deletion as no new keystrokes", () => {
    expect(processInput("FROM", "FRO", TARGET, false)).toEqual({
      next: "FRO",
      typedDelta: 0,
      errorDelta: 0,
      missedTargetChars: [],
    });
  });

  it("counts a mid-string replacement from the common prefix", () => {
    expect(processInput("FROM", "FRxM", TARGET, false)).toEqual({
      next: "FRxM",
      typedDelta: 2,
      errorDelta: 1,
      missedTargetChars: ["O"],
    });
  });

  it("drops input beyond the target length", () => {
    const result = processInput(TARGET, `${TARGET}xyz`, TARGET, false);
    expect(result.next).toBe(TARGET);
    expect(result.typedDelta).toBe(0);
    expect(result.errorDelta).toBe(0);
    expect(result.missedTargetChars).toEqual([]);
  });
});

describe("processInput (stop on error)", () => {
  it("commits correct keystrokes normally", () => {
    expect(processInput("FRO", "FROM", TARGET, true)).toEqual({
      next: "FROM",
      typedDelta: 1,
      errorDelta: 0,
      missedTargetChars: [],
    });
  });

  it("rejects a wrong keystroke but still counts it", () => {
    expect(processInput("FRO", "FROx", TARGET, true)).toEqual({
      next: "FRO",
      typedDelta: 1,
      errorDelta: 1,
      missedTargetChars: ["M"],
    });
  });

  it("commits the correct run and rejects the rest of an insertion", () => {
    // "M" is correct, "x" is not, and nothing after a mistake is committed.
    expect(processInput("FRO", "FROMxn", TARGET, true)).toEqual({
      next: "FROM",
      typedDelta: 3,
      errorDelta: 2,
      missedTargetChars: [" ", "n"],
    });
  });

  it("rejects a correct character that follows a mistake", () => {
    // " " would be correct after "FROM", but it comes after the wrong "x".
    expect(processInput("FRO", "FROx ", TARGET, true)).toEqual({
      next: "FRO",
      typedDelta: 2,
      errorDelta: 2,
      missedTargetChars: ["M", " "],
    });
  });

  it("is strict about whitespace: space is not newline", () => {
    expect(processInput("FROM node", "FROM node ", TARGET, true)).toEqual({
      next: "FROM node",
      typedDelta: 1,
      errorDelta: 1,
      missedTargetChars: ["\n"],
    });
    expect(processInput("FROM node", "FROM node\n", TARGET, true)).toEqual({
      next: "FROM node\n",
      typedDelta: 1,
      errorDelta: 0,
      missedTargetChars: [],
    });
  });

  it("still allows deletion", () => {
    expect(processInput("FROM", "FR", TARGET, true)).toEqual({
      next: "FR",
      typedDelta: 0,
      errorDelta: 0,
      missedTargetChars: [],
    });
  });
});

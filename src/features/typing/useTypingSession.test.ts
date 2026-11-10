// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Lesson } from "../../types/lesson";
import { useTypingSession } from "./useTypingSession";

const lesson: Lesson = {
  id: "test-lesson",
  title: "Test lesson",
  difficulty: "beginner",
  language: "bash",
  text: "ab\ncd",
};

function render(stopOnError = false) {
  return renderHook(() => useTypingSession(lesson, { stopOnError }));
}

describe("useTypingSession", () => {
  it("starts idle and switches to running on the first keystroke", () => {
    const { result } = render();
    expect(result.current.status).toBe("idle");
    expect(result.current.accuracy).toBe(100);

    act(() => result.current.applyInput("a"));
    expect(result.current.status).toBe("running");
    expect(result.current.input).toBe("a");
    expect(result.current.typedCharacters).toBe(1);
    expect(result.current.errors).toBe(0);
  });

  it("keeps committed mistakes in the counters after backspace", () => {
    const { result } = render();
    act(() => result.current.applyInput("a"));
    act(() => result.current.applyInput("ax"));
    act(() => result.current.applyInput("a"));

    expect(result.current.input).toBe("a");
    expect(result.current.typedCharacters).toBe(2);
    expect(result.current.errors).toBe(1);
    expect(result.current.accuracy).toBe(50);
    expect(result.current.missedChars).toEqual({ b: 1 });
  });

  it("finishes only on an exact match, including the newline", () => {
    const { result } = render();
    act(() => result.current.applyInput("ab cd"));
    expect(result.current.status).toBe("running");

    act(() => result.current.applyInput("ab\ncd"));
    expect(result.current.status).toBe("finished");
  });

  it("ignores input after the session is finished", () => {
    const { result } = render();
    act(() => result.current.applyInput("ab\ncd"));
    const typedBefore = result.current.typedCharacters;

    act(() => result.current.applyInput("ab\ncdX"));
    expect(result.current.input).toBe("ab\ncd");
    expect(result.current.typedCharacters).toBe(typedBefore);
  });

  it("clamps input that is longer than the target", () => {
    const { result } = render();
    act(() => result.current.applyInput("ab\ncdEXTRA"));
    expect(result.current.input).toBe("ab\ncd");
  });

  it("rejects wrong keystrokes in stop-on-error mode", () => {
    const { result } = render(true);
    act(() => result.current.applyInput("a"));
    act(() => result.current.applyInput("ax"));

    expect(result.current.input).toBe("a");
    expect(result.current.typedCharacters).toBe(2);
    expect(result.current.errors).toBe(1);
    expect(result.current.rejectionCount).toBe(1);
    expect(result.current.missedChars).toEqual({ b: 1 });

    act(() => result.current.applyInput("ab"));
    expect(result.current.input).toBe("ab");
    expect(result.current.errors).toBe(1);
  });

  it("reset returns the session to a clean idle state", () => {
    const { result } = render();
    act(() => result.current.applyInput("ax"));
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.input).toBe("");
    expect(result.current.typedCharacters).toBe(0);
    expect(result.current.errors).toBe(0);
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.missedChars).toEqual({});
    expect(result.current.accuracy).toBe(100);
  });
});

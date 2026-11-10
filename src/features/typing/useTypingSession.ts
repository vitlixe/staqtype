import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "../../types/lesson";
import { processInput } from "./processInput";
import {
  calculateAccuracy,
  calculateWpm,
  countCorrectChars,
} from "./typingMetrics";

export type SessionStatus = "idle" | "running" | "finished";

export type TypingSessionOptions = {
  /** When true, wrong keystrokes are counted but never committed to the input. */
  stopOnError: boolean;
};

export type TypingSession = {
  input: string;
  status: SessionStatus;
  elapsedMs: number;
  /** Live WPM based on currently correct characters. */
  wpm: number;
  /** Accuracy over every keystroke committed in this session; backspacing does not erase mistakes. */
  accuracy: number;
  /** Total number of wrong keystrokes committed in this session. */
  errors: number;
  /** Total keystrokes committed in this session (toolbar insertions included). */
  typedCharacters: number;
  /** Increments every time stop-on-error rejects a keystroke; drives the UI flash. */
  rejectionCount: number;
  /** Per-character miss counts for this session, keyed by the expected character. */
  missedChars: Record<string, number>;
  applyInput: (next: string) => void;
  reset: () => void;
};

/**
 * One typing run over a lesson. The consuming component must remount the
 * hook per lesson (e.g. with a `key`); the hook itself never resets on
 * lesson change.
 */
export function useTypingSession(
  lesson: Lesson,
  options: TypingSessionOptions,
): TypingSession {
  const target = lesson.text;
  const { stopOnError } = options;

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [typedCharacters, setTypedCharacters] = useState(0);
  const [errors, setErrors] = useState(0);
  const [rejectionCount, setRejectionCount] = useState(0);
  const [missedChars, setMissedChars] = useState<Record<string, number>>({});
  const [startedAt, setStartedAt] = useState(0);
  const [finishedAt, setFinishedAt] = useState(0);
  const [now, setNow] = useState(0);

  // Refs mirror the state that keystroke handling needs synchronously, so
  // fast consecutive events between renders never work with stale values.
  // They are only ever read inside event-handler callbacks, not in render.
  const inputRef = useRef("");
  const startedAtRef = useRef(0);
  const finishedAtRef = useRef(0);

  const reset = useCallback(() => {
    inputRef.current = "";
    startedAtRef.current = 0;
    finishedAtRef.current = 0;
    setInput("");
    setStatus("idle");
    setTypedCharacters(0);
    setErrors(0);
    setRejectionCount(0);
    setMissedChars({});
    setStartedAt(0);
    setFinishedAt(0);
    setNow(0);
  }, []);

  useEffect(() => {
    if (status !== "running") {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [status]);

  const applyInput = useCallback(
    (rawNext: string) => {
      if (finishedAtRef.current !== 0) {
        return;
      }
      const prev = inputRef.current;
      const { next, typedDelta, errorDelta, missedTargetChars } = processInput(
        prev,
        rawNext,
        target,
        stopOnError,
      );

      if (typedDelta > 0) {
        setTypedCharacters((count) => count + typedDelta);
      }
      if (errorDelta > 0) {
        setMissedChars((prevMissed) => {
          const nextMissed = { ...prevMissed };
          for (const char of missedTargetChars) {
            nextMissed[char] = (nextMissed[char] ?? 0) + 1;
          }
          return nextMissed;
        });
        setErrors((count) => count + errorDelta);
        if (stopOnError) {
          setRejectionCount((count) => count + 1);
        }
      }
      if (next === prev && typedDelta === 0) {
        return;
      }

      inputRef.current = next;
      setInput(next);

      if (startedAtRef.current === 0 && typedDelta > 0) {
        const startTime = Date.now();
        startedAtRef.current = startTime;
        setStartedAt(startTime);
        setNow(startTime);
        setStatus("running");
      }
      if (next === target) {
        const endTime = Date.now();
        finishedAtRef.current = endTime;
        setFinishedAt(endTime);
        setNow(endTime);
        setStatus("finished");
      }
    },
    [target, stopOnError],
  );

  const elapsedMs =
    startedAt === 0
      ? 0
      : Math.max(0, (finishedAt !== 0 ? finishedAt : now) - startedAt);

  const correctChars = useMemo(
    () => countCorrectChars(input, target),
    [input, target],
  );

  return {
    input,
    status,
    elapsedMs,
    wpm: calculateWpm(correctChars, elapsedMs),
    accuracy: calculateAccuracy(typedCharacters - errors, typedCharacters),
    errors,
    typedCharacters,
    rejectionCount,
    missedChars,
    applyInput,
    reset,
  };
}

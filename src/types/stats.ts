export type LessonResult = {
  lessonId: string;
  completedAt: string;
  wpm: number;
  accuracy: number;
  errors: number;
  elapsedMs: number;
  typedCharacters: number;
  /** Per-character miss counts for this run, keyed by the expected character. */
  missedChars?: Record<string, number>;
};

export type LocalStats = {
  totalTypedCharacters: number;
  totalErrors: number;
  lessonResults: LessonResult[];
  /** All-time per-character miss counts, keyed by the expected character. */
  charErrors: Record<string, number>;
};

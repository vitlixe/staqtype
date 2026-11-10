import type { LanguageId } from "../data/languages";

export const LESSON_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type LessonDifficulty = (typeof LESSON_DIFFICULTIES)[number];

export type Lesson = {
  /** Stable id: stored results reference it, so never rename an existing one. */
  id: string;
  title: string;
  language: LanguageId;
  difficulty: LessonDifficulty;
  text: string;
};

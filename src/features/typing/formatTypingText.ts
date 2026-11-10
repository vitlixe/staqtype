import type { Lesson } from "../../types/lesson";

export type TargetLine = {
  /** Line content without the trailing newline. */
  chars: string;
  /** Absolute offset of the first character within the target text. */
  start: number;
  /** True for every line except the last one. */
  hasNewline: boolean;
};

export function splitTargetLines(text: string): TargetLine[] {
  const parts = text.split("\n");
  const lines: TargetLine[] = [];
  let start = 0;
  parts.forEach((part, index) => {
    const hasNewline = index < parts.length - 1;
    lines.push({ chars: part, start, hasNewline });
    start += part.length + (hasNewline ? 1 : 0);
  });
  return lines;
}

export function isWhitespaceChar(char: string): boolean {
  return char === " " || char === "\t" || char === "\n";
}

/**
 * What the Tab key (and the mobile toolbar Tab button) types: a real tab
 * when the lesson itself is tab-indented (Go, Makefile), otherwise
 * `tabWidth` spaces. Deeper indents are reached by pressing Tab again.
 */
export function getTabInsertion(lesson: Lesson, tabWidth = 2): string {
  return lesson.text.includes("\t") ? "\t" : " ".repeat(tabWidth);
}

/** Leading spaces/tabs of the line that starts at `lineStart` in `text`. */
export function indentAt(text: string, lineStart: number): string {
  let end = lineStart;
  while (end < text.length && (text[end] === " " || text[end] === "\t")) {
    end++;
  }
  return text.slice(lineStart, end);
}

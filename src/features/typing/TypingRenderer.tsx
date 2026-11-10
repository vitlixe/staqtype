import { memo, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { CodeSize } from "../../hooks/useTypingSettings";
import { displayChar } from "../../utils/text";
import { isWhitespaceChar, splitTargetLines } from "./formatTypingText";

const CODE_SIZE_CLASS: Record<CodeSize, string> = {
  s: "text-[13px] sm:text-[15px]",
  m: "text-[14px] sm:text-[18px]",
  l: "text-[16px] sm:text-[21px]",
};

type CharStatus = "correct" | "wrong" | "current" | "pending";

function charClass(status: CharStatus, whitespace: boolean): string {
  switch (status) {
    case "correct":
      // Typed whitespace disappears so finished lines read like real code.
      return whitespace ? "text-transparent" : "text-ink";
    case "wrong":
      return "rounded-[2px] bg-bad/15 text-bad";
    case "current":
      return "caret-cell";
    case "pending":
      return whitespace ? "text-faint" : "text-dim";
  }
}

type LineRowProps = {
  chars: string;
  hasNewline: boolean;
  /** Typed slice of this line, including its newline character if reached. */
  inputSlice: string;
  /** Cursor offset within this line, or null when the cursor is elsewhere. */
  cursorInLine: number | null;
  /** Rejection counter for the cursor line (0 for all others); a change replays the flash. */
  rejectionCount: number;
  /** The caret blinks only while the user is not typing. */
  blink: boolean;
};

// Rows are memoized so a keystroke re-renders only the active line: for every
// other line `inputSlice` and `cursorInLine` are referentially stable.
const LineRow = memo(function LineRow({
  chars,
  hasNewline,
  inputSlice,
  cursorInLine,
  rejectionCount,
  blink,
}: LineRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cursorInLine !== null) {
      rowRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [cursorInLine]);

  const total = chars.length + (hasNewline ? 1 : 0);
  const cells: ReactNode[] = [];
  for (let i = 0; i < total; i++) {
    const targetChar = i === chars.length ? "\n" : chars[i];
    let status: CharStatus;
    if (i === cursorInLine) {
      status = "current";
    } else if (i < inputSlice.length) {
      status = inputSlice[i] === targetChar ? "correct" : "wrong";
    } else {
      status = "pending";
    }
    // On a mistake, show what was actually typed (not the expected char),
    // so a stray space, tab or Enter is visible as ·, ⇥ or ↵.
    const shownChar = status === "wrong" ? inputSlice[i] : targetChar;
    // Remounting the cursor cell on every rejection replays the red flash
    // that tells the user their keystroke was blocked by stop-on-error.
    const key =
      status === "current" && rejectionCount > 0
        ? `flash-${rejectionCount}`
        : i;
    cells.push(
      <span
        key={key}
        className={`${charClass(status, isWhitespaceChar(shownChar))}${
          status === "current" && blink ? " blink" : ""
        }${status === "current" && rejectionCount > 0 ? " flash-wrong" : ""}`}
      >
        {displayChar(shownChar)}
      </span>,
    );
  }

  return (
    <div ref={rowRef} className="whitespace-pre">
      {cells.length > 0 ? cells : " "}
    </div>
  );
});

type TypingRendererProps = {
  text: string;
  input: string;
  focused: boolean;
  /** Session-wide count of keystrokes rejected by stop-on-error. */
  rejectionCount: number;
  running: boolean;
  codeSize: CodeSize;
  onFocusRequest: () => void;
};

export const TypingRenderer = memo(function TypingRenderer({
  text,
  input,
  focused,
  rejectionCount,
  running,
  codeSize,
  onFocusRequest,
}: TypingRendererProps) {
  const lines = useMemo(() => splitTargetLines(text), [text]);
  const cursor = Math.min(input.length, text.length);
  const finished = input === text;

  return (
    <div className="relative">
      <div
        onClick={onFocusRequest}
        className={`max-h-[60vh] cursor-text overflow-auto overscroll-contain rounded-2xl border border-line bg-surface px-5 py-5 font-mono leading-[1.8] sm:px-7 sm:py-6 ${CODE_SIZE_CLASS[codeSize]}`}
      >
        {lines.map((line, index) => {
          const lineTotal = line.chars.length + (line.hasNewline ? 1 : 0);
          const end = line.start + lineTotal;
          const inputSlice =
            input.length > line.start
              ? input.slice(line.start, Math.min(end, input.length))
              : "";
          const cursorInLine =
            !finished && cursor >= line.start && cursor < end
              ? cursor - line.start
              : null;
          return (
            <LineRow
              key={index}
              chars={line.chars}
              hasNewline={line.hasNewline}
              inputSlice={inputSlice}
              cursorInLine={cursorInLine}
              // Stable 0 for inactive lines keeps their memoization intact.
              rejectionCount={cursorInLine !== null ? rejectionCount : 0}
              blink={!running}
            />
          );
        })}
      </div>
      {!focused && !finished && (
        <button
          type="button"
          onClick={onFocusRequest}
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-bg/60 text-sm text-mid backdrop-blur-[2px]"
        >
          click or tap here to type
        </button>
      )}
    </div>
  );
});

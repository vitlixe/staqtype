import { useEffect, useState } from "react";

const WORD = "staqtype";
const SPLIT = 4; // "staq" + accented "type"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Brand mark: three indented code lines with a caret on the last one. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect x="1" y="1" width="30" height="30" rx="8" className="fill-surface stroke-line" />
      <rect x="7" y="8.5" width="13" height="3" rx="1.5" className="fill-mid" />
      <rect x="11" y="14.5" width="14" height="3" rx="1.5" className="fill-dim" />
      <rect x="11" y="20.5" width="7" height="3" rx="1.5" className="fill-accent" />
      <rect x="20" y="19" width="2.2" height="6" rx="1.1" className="fill-accent" />
    </svg>
  );
}

/** The name types itself once on load, then the caret fades out. */
export function LogoWord() {
  const [typed, setTyped] = useState(() =>
    prefersReducedMotion() ? WORD.length : 0,
  );
  const [caret, setCaret] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    if (typed >= WORD.length) {
      const id = window.setTimeout(() => setCaret(false), 2200);
      return () => window.clearTimeout(id);
    }
    const delay = typed === 0 ? 350 : 75 + Math.random() * 70;
    const id = window.setTimeout(() => setTyped((n) => n + 1), delay);
    return () => window.clearTimeout(id);
  }, [typed]);

  return (
    <span
      aria-hidden="true"
      className="inline-flex min-w-[8.6ch] items-center font-mono text-[19px] font-semibold tracking-tight text-ink"
    >
      {WORD.slice(0, Math.min(typed, SPLIT))}
      <span className="text-accent">
        {typed > SPLIT ? WORD.slice(SPLIT, typed) : ""}
      </span>
      <span
        className={`ml-0.5 inline-block h-[1.05em] w-0.5 bg-accent transition-opacity duration-500 ${
          caret ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}

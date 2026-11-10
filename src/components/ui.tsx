import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LANGUAGES } from "../data/languages";
import type { LanguageId } from "../data/languages";

/** Colored dot that identifies a language everywhere in the app. */
export function LangDot({ language }: { language: LanguageId }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ backgroundColor: LANGUAGES[language] }}
    />
  );
}

/** Raised surface: the one container style of the app. */
export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface ${className}`}>
      {children}
    </div>
  );
}

type PillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  /** Greyed out, e.g. a filter value with no matches. */
  muted?: boolean;
};

/** Filter toggle. */
export function Pill({ active, muted, className = "", children, ...rest }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13.5px] transition-colors ${
        active
          ? "border-accent/60 bg-accent/12 text-ink"
          : "border-line bg-surface text-mid hover:text-ink"
      } ${muted && !active ? "opacity-40" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Segmented on/off style choice used in settings. */
export function Segmented<T extends string | number | boolean>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex gap-0.5 rounded-[9px] border border-line bg-bg p-[3px]"
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-0.5 text-[13.5px] transition-colors ${
            option.value === value ? "bg-line text-ink" : "text-dim hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

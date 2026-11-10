const SYMBOLS = [
  ":",
  "*",
  "_",
  "/",
  ".",
  '"',
  "'",
  "[",
  "]",
  "{",
  "}",
  "|",
  "#",
  "$",
  "=",
  "@",
] as const;

type ToolbarKeyProps = {
  label: string;
  insert: string;
  wide?: boolean;
  onInsert: (text: string) => void;
};

function ToolbarKey({ label, insert, wide, onInsert }: ToolbarKeyProps) {
  return (
    <button
      type="button"
      // Keep focus (and the mobile keyboard) on the hidden textarea.
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => onInsert(insert)}
      className={`h-11 shrink-0 rounded-lg border border-line bg-surface font-mono text-base text-ink transition-colors active:bg-line ${
        wide ? "px-3 text-sm font-medium" : "min-w-10 px-2"
      }`}
    >
      {label}
    </button>
  );
}

type MobileSymbolToolbarProps = {
  /** What the Tab key inserts for the current lesson (see getTabInsertion). */
  tabInsertion: string;
  onInsert: (text: string) => void;
};

/**
 * Sticky helper keyboard for symbols that are hard to reach on mobile
 * layouts. Hidden on large screens where a physical keyboard is expected.
 */
export function MobileSymbolToolbar({
  tabInsertion,
  onInsert,
}: MobileSymbolToolbarProps) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-line bg-bg/95 backdrop-blur lg:hidden">
      <div className="flex flex-wrap justify-center gap-1.5 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <ToolbarKey label="Tab ⇥" insert={tabInsertion} wide onInsert={onInsert} />
        <ToolbarKey label="Enter ⏎" insert={"\n"} wide onInsert={onInsert} />
        {SYMBOLS.map((symbol) => (
          <ToolbarKey
            key={symbol}
            label={symbol}
            insert={symbol}
            onInsert={onInsert}
          />
        ))}
      </div>
    </div>
  );
}

import { Panel } from "../../components/ui";
import { keyLabel } from "../../utils/text";
import { formatTime } from "./typingMetrics";

type ResultPanelProps = {
  wpm: number;
  accuracy: number;
  errors: number;
  elapsedMs: number;
  typedCharacters: number;
  /** Per-character misses of this run, keyed by the expected character. */
  missedChars: Record<string, number>;
  /** Best WPM on this lesson before this run; null for a first run. */
  previousBestWpm: number | null;
};

function bestLine(wpm: number, previousBestWpm: number | null): { text: string; up: boolean } {
  if (previousBestWpm === null) {
    return { text: "first run", up: false };
  }
  const delta = Math.round(wpm) - Math.round(previousBestWpm);
  if (delta > 0) {
    return { text: `new best · +${delta} over ${Math.round(previousBestWpm)}`, up: true };
  }
  return { text: `best ${Math.round(previousBestWpm)} wpm`, up: false };
}

export function ResultPanel({
  wpm,
  accuracy,
  errors,
  elapsedMs,
  typedCharacters,
  missedChars,
  previousBestWpm,
}: ResultPanelProps) {
  const missed = Object.entries(missedChars)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const best = bestLine(wpm, previousBestWpm);

  return (
    <div className="flex flex-col gap-7" aria-live="polite">
      <div className="flex flex-wrap items-end gap-3.5">
        <Panel className="flex flex-col gap-2 px-6 py-5">
          <b className="font-mono text-[clamp(44px,9vw,72px)] leading-none font-semibold tracking-tight text-accent tabular-nums">
            {Math.round(wpm)}
          </b>
          <span className="text-[13px] text-dim">wpm</span>
        </Panel>
        <Panel className="flex flex-col gap-2 px-6 py-5">
          <b className="font-mono text-[clamp(44px,9vw,72px)] leading-none font-semibold tracking-tight text-ink tabular-nums">
            {accuracy.toFixed(1)}%
          </b>
          <span className="text-[13px] text-dim">accuracy</span>
        </Panel>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm tabular-nums">
        <span>
          time <b className="font-medium text-ink">{formatTime(elapsedMs)}</b>
        </span>
        <span>
          chars <b className="font-medium text-ink">{typedCharacters}</b>
        </span>
        <span>
          errors <b className="font-medium text-ink">{errors}</b>
        </span>
        {missed.length > 0 && (
          <span>
            missed{" "}
            <b className="font-medium text-ink">
              {missed.map(([char, count]) => `${keyLabel(char)} ${count}`).join("  ")}
            </b>
          </span>
        )}
        <span className={best.up ? "text-accent" : ""}>{best.text}</span>
      </div>
    </div>
  );
}

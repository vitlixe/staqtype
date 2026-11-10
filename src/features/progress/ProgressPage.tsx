import { useMemo } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LangDot, Panel } from "../../components/ui";
import { lessons } from "../../data/lessons";
import { useLocalStats } from "../../hooks/useLocalStats";
import { keyLabel } from "../../utils/text";
import { formatDaysAgo, formatDuration, summarizeProgress } from "./progressSummary";
import { WpmChart } from "./WpmChart";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="px-5 py-4">
      <h2 className="mb-3.5 text-[13px] font-semibold text-mid">{title}</h2>
      {children}
    </Panel>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <Panel className="flex min-w-0 flex-col gap-1.5 px-[18px] py-4">
      <b
        className={`font-mono text-[28px] leading-none font-semibold tracking-tight tabular-nums ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </b>
      <span className="text-xs text-dim">{label}</span>
    </Panel>
  );
}

export function ProgressPage() {
  const { stats } = useLocalStats();
  const summary = useMemo(() => summarizeProgress(stats, lessons), [stats]);

  if (summary.sessions === 0) {
    return (
      <Panel className="my-auto px-6 py-8 text-center">
        <p className="text-ink">No finished lessons yet.</p>
        <p className="mt-1 text-sm text-dim">
          Finish a lesson and your speed, accuracy and missed keys show up here.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
          pick a lesson →
        </Link>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <Stat value={String(summary.sessions)} label="sessions" />
        <Stat value={String(Math.round(summary.avgWpm))} label="avg wpm" accent />
        <Stat value={String(Math.round(summary.bestWpm))} label="best wpm" />
        <Stat value={`${summary.accuracy.toFixed(1)}%`} label="accuracy" />
        <div className="col-span-2 sm:col-span-1">
          <Stat value={formatDuration(summary.timeMs)} label="time typing" />
        </div>
      </div>

      <Section title={`wpm per run · last ${summary.wpmHistory.length}`}>
        <WpmChart values={summary.wpmHistory} />
      </Section>

      <Section title="by language">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-[13.5px]">
            <tbody>
              {summary.byLanguage.map((row) => (
                <tr key={row.language} className="border-b border-line last:border-b-0">
                  <td className="py-2 pr-4 whitespace-nowrap text-ink">
                    <span className="inline-flex items-center gap-2">
                      <LangDot language={row.language} />
                      {row.language}
                    </span>
                  </td>
                  <td className="w-2/5 py-2 pr-4">
                    <span className="block h-1 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${Math.round((row.typed / row.lessons) * 100)}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-[12.5px] whitespace-nowrap tabular-nums">
                    {row.typed}/{row.lessons} typed
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-[12.5px] whitespace-nowrap tabular-nums">
                    {row.avgWpm ? `${Math.round(row.avgWpm)} avg` : "—"}
                  </td>
                  <td className="py-2 text-right font-mono text-[12.5px] whitespace-nowrap tabular-nums">
                    {row.bestWpm ? `${Math.round(row.bestWpm)} best` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {summary.missedKeys.length > 0 && (
        <Section title="keys you miss most">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2.5">
            {summary.missedKeys.map(([char, count]) => (
              <span key={char} className="font-mono text-[22px] text-ink">
                {keyLabel(char)}
                <sup className="ml-1.5 align-baseline text-xs text-bad">{count}</sup>
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="recent">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-[13.5px]">
            <tbody>
              {summary.recent.map(({ result, lesson }, index) => (
                <tr key={`${result.completedAt}-${index}`} className="border-b border-line last:border-b-0">
                  <td className="py-2 pr-4 text-ink">{lesson?.title ?? result.lessonId}</td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap text-dim">
                    {lesson?.language}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-[12.5px] whitespace-nowrap tabular-nums">
                    {Math.round(result.wpm)} wpm
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-[12.5px] whitespace-nowrap tabular-nums">
                    {result.accuracy.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right whitespace-nowrap text-dim">
                    {formatDaysAgo(result.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

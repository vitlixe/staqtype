import { useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Panel, Segmented } from "../../components/ui";
import { useLocalStats } from "../../hooks/useLocalStats";
import { useTypingSettings } from "../../hooks/useTypingSettings";
import type { CodeSize } from "../../hooks/useTypingSettings";
import { emptyStats, sanitizeStats } from "../../utils/statsStorage";

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line py-4 last:border-b-0">
      <div className="min-w-0">
        <b className="font-medium text-ink">{title}</b>
        {hint && <p className="mt-0.5 max-w-[56ch] text-[13px] text-dim">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const BUTTON =
  "inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[13.5px] font-medium transition-colors";
const OUTLINE = "border-line bg-bg text-ink hover:border-faint";
const OUTLINE_BAD = "border-bad/35 text-bad hover:bg-bad/10";
const PLAIN = "border-transparent text-mid hover:text-ink";
const SOLID_BAD = "border-bad bg-bad text-bg hover:bg-bad/90";

const ICON_PATHS = {
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  upload: "M12 15V4M7 9l5-5 5 5M5 20h14",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
};

function Icon({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[15px] shrink-0 fill-none stroke-current stroke-2 opacity-80 [stroke-linecap:round] [stroke-linejoin:round]"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function SettingsPage() {
  const { settings, updateSettings } = useTypingSettings();
  const { stats, importStats } = useLocalStats();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const runs = stats.lessonResults.length;

  const exportStats = () => {
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "staqtype-stats.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      const next = sanitizeStats(JSON.parse(await file.text()));
      if (!window.confirm(`Replace current progress with "${file.name}" (${next.lessonResults.length} runs)?`)) {
        return;
      }
      importStats(next);
      setMessage("Progress imported.");
    } catch {
      setMessage("Could not read that file: it is not a staqtype progress JSON.");
    }
  };

  return (
    <Panel className="px-5">
      <Row title="stop on error" hint="A wrong key is counted but not written, so you fix it before moving on.">
        <Segmented
          label="stop on error"
          value={settings.stopOnError}
          options={[
            { value: true, label: "on" },
            { value: false, label: "off" },
          ]}
          onChange={(stopOnError) => updateSettings({ stopOnError })}
        />
      </Row>
      <Row title="tab key types" hint="What Tab inserts in lessons indented with spaces. Go and Makefile lessons use real tabs.">
        <Segmented<2 | 4>
          label="tab key types"
          value={settings.tabWidth}
          options={[
            { value: 2, label: "2 spaces" },
            { value: 4, label: "4 spaces" },
          ]}
          onChange={(tabWidth) => updateSettings({ tabWidth })}
        />
      </Row>
      <Row title="auto-indent after enter" hint="Off keeps indentation part of the exercise.">
        <Segmented
          label="auto-indent after enter"
          value={settings.autoIndent}
          options={[
            { value: false, label: "off" },
            { value: true, label: "on" },
          ]}
          onChange={(autoIndent) => updateSettings({ autoIndent })}
        />
      </Row>
      <Row title="code size">
        <Segmented<CodeSize>
          label="code size"
          value={settings.codeSize}
          options={[
            { value: "s", label: "s" },
            { value: "m", label: "m" },
            { value: "l", label: "l" },
          ]}
          onChange={(codeSize) => updateSettings({ codeSize })}
        />
      </Row>
      <Row
        title="progress"
        hint={message ?? `${runs} finished ${runs === 1 ? "run" : "runs"} stored in this browser.`}
      >
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[13.5px] text-bad">Delete all progress?</span>
            <button type="button" className={`${BUTTON} ${PLAIN}`} onClick={() => setConfirmReset(false)}>
              cancel
            </button>
            <button
              type="button"
              className={`${BUTTON} ${SOLID_BAD}`}
              onClick={() => {
                importStats(emptyStats());
                setConfirmReset(false);
                setMessage("Progress deleted.");
              }}
            >
              <Icon name="trash" />
              delete
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className={`${BUTTON} ${OUTLINE}`} onClick={exportStats}>
              <Icon name="download" />
              export
            </button>
            <button type="button" className={`${BUTTON} ${OUTLINE}`} onClick={() => fileRef.current?.click()}>
              <Icon name="upload" />
              import
            </button>
            <button type="button" className={`${BUTTON} ${OUTLINE_BAD}`} onClick={() => setConfirmReset(true)}>
              <Icon name="trash" />
              reset
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={onImportFile}
              className="hidden"
            />
          </div>
        )}
      </Row>
      <Row title="version">
        <span className="px-2.5 font-mono text-[13.5px] text-mid">{__APP_VERSION__}</span>
      </Row>
    </Panel>
  );
}

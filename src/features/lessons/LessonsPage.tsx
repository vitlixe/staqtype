import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LangDot, Panel, Pill } from "../../components/ui";
import { LANGUAGE_IDS } from "../../data/languages";
import type { LanguageId } from "../../data/languages";
import { lessons } from "../../data/lessons";
import { LESSON_DIFFICULTIES } from "../../types/lesson";
import type { Lesson, LessonDifficulty } from "../../types/lesson";
import { useLocalStats } from "../../hooks/useLocalStats";
import { bestWpmByLesson } from "../../utils/statsStorage";
import { countLines } from "../../utils/text";

type SortKey = "title" | "language" | "level" | "lines" | "best";
type Sort = { by: SortKey; dir: 1 | -1 };

const LEVEL_CLASS: Record<LessonDifficulty, string> = {
  beginner: "text-good",
  intermediate: "text-warn",
  advanced: "text-bad",
};

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "title", label: "lesson" },
  { key: "language", label: "language" },
  { key: "level", label: "level" },
  { key: "lines", label: "lines", numeric: true },
  { key: "best", label: "best wpm", numeric: true },
];

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query) : -1;
  if (at < 0) {
    return <>{text}</>;
  }
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent text-accent">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

export function LessonsPage() {
  const navigate = useNavigate();
  const { stats } = useLocalStats();
  const best = useMemo(() => bestWpmByLesson(stats.lessonResults), [stats.lessonResults]);

  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<LanguageId | "all">("all");
  const [level, setLevel] = useState<LessonDifficulty | "all">("all");
  const [sort, setSort] = useState<Sort>({ by: "language", dir: 1 });
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const q = query.trim().toLowerCase();
  const matches = (lesson: Lesson) =>
    (!q || `${lesson.title} ${lesson.language}`.toLowerCase().includes(q)) &&
    (level === "all" || lesson.difficulty === level);

  const languageCounts = new Map<LanguageId | "all", number>([["all", 0]]);
  for (const lesson of lessons) {
    if (matches(lesson)) {
      languageCounts.set("all", (languageCounts.get("all") ?? 0) + 1);
      languageCounts.set(lesson.language, (languageCounts.get(lesson.language) ?? 0) + 1);
    }
  }
  const usedLanguages = LANGUAGE_IDS.filter((id) => lessons.some((l) => l.language === id));

  const rows = lessons
    .filter((lesson) => matches(lesson) && (language === "all" || lesson.language === language))
    .map((lesson, order) => ({ lesson, order }));
  const value = (row: (typeof rows)[number]): string | number => {
    switch (sort.by) {
      case "title":
        return row.lesson.title.toLowerCase();
      case "language":
        return LANGUAGE_IDS.indexOf(row.lesson.language) * 1000 + row.order;
      case "level":
        return LESSON_DIFFICULTIES.indexOf(row.lesson.difficulty) * 1000 + row.order;
      case "lines":
        return countLines(row.lesson.text);
      case "best":
        return best.get(row.lesson.id) ?? 0;
    }
  };
  rows.sort((a, b) => {
    const x = value(a);
    const y = value(b);
    return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
  });
  const activeIndex = Math.min(active, Math.max(0, rows.length - 1));
  const typedCount = rows.filter((row) => best.has(row.lesson.id)).length;

  // "/" jumps to the search field from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && !target?.closest("input, textarea, select")) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((rows.length ? activeIndex + step + rows.length : 0) % Math.max(1, rows.length));
    } else if (event.key === "Enter" && rows[activeIndex]) {
      event.preventDefault();
      navigate(`/type/${rows[activeIndex].lesson.id}`);
    } else if (event.key === "Escape") {
      setQuery("");
      event.currentTarget.blur();
    }
  };

  const toggleSort = (by: SortKey) =>
    setSort((prev) =>
      prev.by === by
        ? { by, dir: prev.dir === 1 ? -1 : 1 }
        : { by, dir: by === "best" || by === "lines" ? -1 : 1 },
    );

  return (
    <div className="flex flex-col">
      <label className="flex h-14 items-center gap-3.5 rounded-[13px] border border-line bg-surface px-[18px] focus-within:border-accent/60">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-[18px] shrink-0 fill-none stroke-dim stroke-2 [stroke-linecap:round]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onSearchKeyDown}
          placeholder="search: fastapi, join, readiness…"
          aria-label="Search lessons"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-dim [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="rounded-[5px] border border-line px-1.5 font-mono text-xs text-dim">/</kbd>
      </label>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Language">
          {(["all", ...usedLanguages] as const).map((id) => {
            const count = languageCounts.get(id) ?? 0;
            return (
              <Pill
                key={id}
                active={language === id}
                muted={count === 0}
                onClick={() => {
                  setLanguage(id);
                  setActive(0);
                }}
              >
                {id}
                <sup className="font-mono text-[10px] text-dim">{count}</sup>
              </Pill>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Level">
          {(["all", ...LESSON_DIFFICULTIES] as const).map((id) => (
            <Pill
              key={id}
              active={level === id}
              onClick={() => {
                setLevel(id);
                setActive(0);
              }}
            >
              {id === "all" ? "any level" : id}
            </Pill>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-dim">
          Nothing found. Try “fastapi”, “join” or “readiness”, or pick “all”.
        </p>
      ) : (
        <Panel className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sort.by === column.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"
                    }
                    className={`border-b border-line px-4 py-3 text-xs font-medium whitespace-nowrap text-dim ${
                      column.numeric ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`hover:text-ink ${sort.by === column.key ? "text-ink" : ""}`}
                    >
                      {column.label}
                      {sort.by === column.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ lesson }, index) => {
                const bestWpm = best.get(lesson.id);
                const isActive = q !== "" && index === activeIndex;
                return (
                  <tr
                    key={lesson.id}
                    onClick={() => navigate(`/type/${lesson.id}`)}
                    className="group cursor-pointer border-b border-line last:border-b-0 hover:bg-line/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/type/${lesson.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className={`font-medium group-hover:text-accent ${isActive ? "text-accent" : "text-ink"}`}
                      >
                        <Highlight text={lesson.title} query={q} />
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <LangDot language={lesson.language} />
                        {lesson.language}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-[13px] whitespace-nowrap ${LEVEL_CLASS[lesson.difficulty]}`}>
                      {lesson.difficulty}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12.5px] tabular-nums">
                      {countLines(lesson.text)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12.5px] tabular-nums">
                      {bestWpm ? (
                        <span className="text-ink">
                          {Math.round(bestWpm)} <span className="text-accent">✓</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}

      <p className="mt-6 text-[12.5px] text-dim">
        <span className="text-mid">{rows.length}</span> lessons ·{" "}
        <span className="text-mid">{typedCount}</span> typed
      </p>
    </div>
  );
}

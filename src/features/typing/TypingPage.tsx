import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getLessonById, lessons } from "../../data/lessons";
import type { Lesson } from "../../types/lesson";
import { useLocalStats } from "../../hooks/useLocalStats";
import { useTypingSettings } from "../../hooks/useTypingSettings";
import { bestWpmByLesson } from "../../utils/statsStorage";
import { countLines } from "../../utils/text";
import { getTabInsertion, indentAt } from "./formatTypingText";
import { MobileSymbolToolbar } from "./MobileSymbolToolbar";
import { ResultPanel } from "./ResultPanel";
import { TypingRenderer } from "./TypingRenderer";
import { formatTime } from "./typingMetrics";
import { useTypingSession } from "./useTypingSession";

/** The next lesson in the same language, wrapping around. */
function nextLessonFor(lesson: Lesson): Lesson {
  const same = lessons.filter((l) => l.language === lesson.language);
  return same[(same.findIndex((l) => l.id === lesson.id) + 1) % same.length];
}

export function TypingPage() {
  const { lessonId } = useParams();
  const { stats } = useLocalStats();

  if (!lessonId) {
    // /type without an id resumes the last lesson, or starts the first one.
    const lastId = stats.lessonResults.at(-1)?.lessonId;
    const resume = getLessonById(lastId) ?? lessons[0];
    return <Navigate to={`/type/${resume.id}`} replace />;
  }
  const lesson = getLessonById(lessonId);
  if (!lesson) {
    return <Navigate to="/" replace />;
  }
  // Remounting per lesson id gives every lesson a fresh session and refs.
  return <TypingScreen key={lesson.id} lesson={lesson} />;
}

function Hint({ keys, children, onClick }: { keys: string; children: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <kbd className="mr-1.5 rounded-[5px] border border-line bg-surface px-1.5 font-mono text-[11.5px] text-mid">
        {keys}
      </kbd>
      {children}
    </>
  );
  return onClick ? (
    <button
      type="button"
      // Keep focus (and the mobile keyboard) on the hidden textarea.
      onPointerDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="hover:text-ink"
    >
      {body}
    </button>
  ) : (
    <span>{body}</span>
  );
}

function LiveBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg border border-line bg-surface px-2.5 py-1 font-mono text-sm font-medium text-accent tabular-nums">
      {children}
    </span>
  );
}

function TypingScreen({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  const { settings } = useTypingSettings();
  const session = useTypingSession(lesson, { stopOnError: settings.stopOnError });
  const { applyInput, status, reset } = session;
  const { stats, recordResult } = useLocalStats();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [previousBestWpm, setPreviousBestWpm] = useState<number | null>(null);
  const savedRef = useRef(false);
  const tabInsertion = getTabInsertion(lesson, settings.tabWidth);
  const nextLesson = nextLessonFor(lesson);
  const language = lesson.language;
  const bestWpm = bestWpmByLesson(stats.lessonResults).get(lesson.id) ?? null;

  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  // Put the caret straight into the exercise when the screen opens (also
  // after "next lesson"). Mobile browsers may ignore focus outside a tap,
  // in which case the overlay on the code still does its job.
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const insertAtCursor = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      if (!el || status === "finished") {
        return;
      }
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      applyInput(el.value.slice(0, start) + text + el.value.slice(end));
      const caret = Math.min(start + text.length, lesson.text.length);
      // Restore focus and caret after React re-renders the controlled value.
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    },
    [applyInput, status, lesson.text.length],
  );

  const goNext = useCallback(() => navigate(`/type/${nextLesson.id}`), [navigate, nextLesson.id]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        goNext();
      } else if (event.key === "Tab") {
        // Keep focus in the exercise and type the lesson's indent instead.
        event.preventDefault();
        insertAtCursor(tabInsertion);
      } else if (
        event.key === "Enter" &&
        settings.autoIndent &&
        lesson.text[session.input.length] === "\n"
      ) {
        event.preventDefault();
        insertAtCursor("\n" + indentAt(lesson.text, session.input.length + 1));
      }
    },
    [goNext, insertAtCursor, tabInsertion, settings.autoIndent, lesson.text, session.input.length],
  );

  useEffect(() => {
    if (status !== "finished" || savedRef.current) {
      return;
    }
    savedRef.current = true;
    // Capture the best WPM *before* this run is recorded, for the result line.
    setPreviousBestWpm(bestWpm);
    recordResult({
      lessonId: lesson.id,
      completedAt: new Date().toISOString(),
      wpm: Math.round(session.wpm * 10) / 10,
      accuracy: Math.round(session.accuracy * 10) / 10,
      errors: session.errors,
      elapsedMs: session.elapsedMs,
      typedCharacters: session.typedCharacters,
      missedChars: { ...session.missedChars },
    });
  }, [status, session, recordResult, lesson.id, bestWpm]);

  const handleRetry = useCallback(() => {
    savedRef.current = false;
    reset();
    focusInput();
  }, [reset, focusInput]);

  // Esc restarts from anywhere; after a finished run Enter opens the next lesson.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleRetry();
      } else if (event.key === "Enter" && status === "finished") {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRetry, goNext, status]);

  const tabLabel = tabInsertion === "\t" ? "tab character" : `${tabInsertion.length} spaces`;

  return (
    <div className={`flex flex-col ${status === "finished" ? "" : "my-auto"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 text-[13px] text-dim">
        <span>
          <Link to="/" className="hover:text-ink">
            {language}
          </Link>{" "}
          / <b className="font-medium text-mid">{lesson.title}</b>
        </span>
        <span>
          {lesson.difficulty} · {countLines(lesson.text)} lines
          {bestWpm !== null && ` · best ${Math.round(bestWpm)} wpm`}
        </span>
      </div>

      {status === "finished" ? (
        <div className="mt-8">
          <ResultPanel
            wpm={session.wpm}
            accuracy={session.accuracy}
            errors={session.errors}
            elapsedMs={session.elapsedMs}
            typedCharacters={session.typedCharacters}
            missedChars={session.missedChars}
            previousBestWpm={previousBestWpm}
          />
        </div>
      ) : (
        <>
          <div
            className={`mt-3.5 mb-2 flex h-8 gap-2 ${status === "running" ? "" : "invisible"}`}
            aria-hidden={status !== "running"}
          >
            <LiveBadge>
              {Math.round(session.wpm)} <span className="text-xs text-dim">wpm</span>
            </LiveBadge>
            <LiveBadge>
              {session.accuracy.toFixed(0)}% <span className="text-xs text-dim">acc</span>
            </LiveBadge>
            <LiveBadge>{formatTime(session.elapsedMs)}</LiveBadge>
          </div>
          <TypingRenderer
            text={lesson.text}
            input={session.input}
            focused={focused}
            rejectionCount={session.rejectionCount}
            running={status === "running"}
            codeSize={settings.codeSize}
            onFocusRequest={focusInput}
          />
        </>
      )}

      <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-dim">
        {status === "finished" ? (
          <>
            <Hint keys="↵" onClick={goNext}>
              next {language} lesson
            </Hint>
            <Hint keys="esc" onClick={handleRetry}>
              type it again
            </Hint>
            <Link to="/" className="hover:text-ink">
              all lessons
            </Link>
          </>
        ) : (
          <>
            <Hint keys="esc" onClick={handleRetry}>
              restart
            </Hint>
            <Hint keys="tab">{tabLabel}</Hint>
            <Hint keys="⇧↵" onClick={goNext}>
              next {language} lesson
            </Hint>
          </>
        )}
      </div>

      {status !== "finished" && (
        <MobileSymbolToolbar tabInsertion={tabInsertion} onInsert={insertAtCursor} />
      )}

      {/* The real input: visually hidden but focusable, so hardware and
          on-screen keyboards work while the renderer stays the display. */}
      <textarea
        ref={textareaRef}
        value={session.input}
        onChange={(event) => applyInput(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={(event) => event.preventDefault()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="enter"
        aria-label="Typing input"
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px resize-none opacity-0"
      />
    </div>
  );
}

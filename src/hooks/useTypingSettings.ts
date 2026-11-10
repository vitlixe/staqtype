import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "staqtype:settings:v1";

export type CodeSize = "s" | "m" | "l";

export type TypingSettings = {
  /** Reject wrong keystrokes instead of letting them into the input. */
  stopOnError: boolean;
  /** Spaces the Tab key types in lessons indented with spaces. */
  tabWidth: 2 | 4;
  /** After Enter, type the next line's indentation automatically. */
  autoIndent: boolean;
  /** Font size of the lesson code. */
  codeSize: CodeSize;
};

export const DEFAULT_SETTINGS: TypingSettings = {
  stopOnError: true,
  tabWidth: 2,
  autoIndent: false,
  codeSize: "m",
};

/** Coerces stored (possibly older or partial) settings into a valid object. */
export function sanitizeSettings(value: unknown): TypingSettings {
  const parsed = (
    typeof value === "object" && value !== null ? value : {}
  ) as Partial<Record<keyof TypingSettings, unknown>>;
  return {
    stopOnError:
      typeof parsed.stopOnError === "boolean"
        ? parsed.stopOnError
        : DEFAULT_SETTINGS.stopOnError,
    tabWidth:
      parsed.tabWidth === 2 || parsed.tabWidth === 4
        ? parsed.tabWidth
        : DEFAULT_SETTINGS.tabWidth,
    autoIndent:
      typeof parsed.autoIndent === "boolean"
        ? parsed.autoIndent
        : DEFAULT_SETTINGS.autoIndent,
    codeSize:
      parsed.codeSize === "s" || parsed.codeSize === "m" || parsed.codeSize === "l"
        ? parsed.codeSize
        : DEFAULT_SETTINGS.codeSize,
  };
}

function loadSettings(): TypingSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useTypingSettings() {
  const [settings, setSettings] = useState<TypingSettings>(loadSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage may be full or blocked; the setting stays in memory.
    }
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<TypingSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, updateSettings };
}

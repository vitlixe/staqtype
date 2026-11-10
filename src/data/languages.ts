/** Languages and their dot colors, in the order of the lessons filter. */
export const LANGUAGES = {
  bash: "#a3e635",
  yaml: "#f472b6",
  python: "#facc15",
  go: "#22d3ee",
  typescript: "#60a5fa",
  sql: "#fb923c",
  dockerfile: "#38bdf8",
  hcl: "#a78bfa",
  css: "#c084fc",
  nginx: "#4ade80",
  ini: "#94a3b8",
  makefile: "#fbbf24",
  gitignore: "#f87171",
  swift: "#fb7185",
} as const;

export type LanguageId = keyof typeof LANGUAGES;

export const LANGUAGE_IDS = Object.keys(LANGUAGES) as LanguageId[];

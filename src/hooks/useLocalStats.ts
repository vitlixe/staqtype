import { useCallback, useEffect, useState } from "react";
import type { LessonResult, LocalStats } from "../types/stats";
import { applyResult, loadStats, saveStats } from "../utils/statsStorage";

export function useLocalStats() {
  const [stats, setStats] = useState<LocalStats>(loadStats);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const recordResult = useCallback((result: LessonResult) => {
    setStats((prev) => applyResult(prev, result));
  }, []);

  /** Replaces all stored stats, e.g. from an imported backup file. */
  const importStats = useCallback((next: LocalStats) => {
    setStats(next);
  }, []);

  return { stats, recordResult, importStats };
}

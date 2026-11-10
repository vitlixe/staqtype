export type InputUpdate = {
  /** The input value to commit to the session. */
  next: string;
  /** Newly typed characters, including rejected ones in stop-on-error mode. */
  typedDelta: number;
  /** Wrong keystrokes among the newly typed characters. */
  errorDelta: number;
  /** Target characters the user missed with the new keystrokes; feeds the weak-keys stats. */
  missedTargetChars: string[];
};

function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) {
    i++;
  }
  return i;
}

/**
 * Turns a raw textarea value into the committed session input plus keystroke
 * deltas. Everything after the common prefix with the previous value counts
 * as newly typed; deleting characters adds nothing and never erases already
 * committed mistakes from the counters.
 *
 * In stop-on-error mode a wrong keystroke is counted but not committed: the
 * input can only ever grow with correct characters, so the cursor stays on
 * the mistake until the right key is pressed.
 */
export function processInput(
  prev: string,
  rawNext: string,
  target: string,
  stopOnError: boolean,
): InputUpdate {
  // Never keep more characters than the target has; overflow is dropped.
  const next =
    rawNext.length > target.length ? rawNext.slice(0, target.length) : rawNext;
  const prefix = commonPrefixLength(prev, next);
  const added = next.length - prefix;

  if (added <= 0) {
    return { next, typedDelta: 0, errorDelta: 0, missedTargetChars: [] };
  }

  if (!stopOnError) {
    const missed: string[] = [];
    for (let i = prefix; i < next.length; i++) {
      if (next[i] !== target[i]) {
        missed.push(target[i]);
      }
    }
    return {
      next,
      typedDelta: added,
      errorDelta: missed.length,
      missedTargetChars: missed,
    };
  }

  // Commit only the leading correct run of the newly typed characters; the
  // first mistake and everything after it is counted and thrown away.
  let commitEnd = prefix;
  const missed: string[] = [];
  for (let i = prefix; i < next.length; i++) {
    if (missed.length === 0 && next[i] === target[i]) {
      commitEnd = i + 1;
    } else {
      missed.push(target[i]);
    }
  }
  return {
    next: next.slice(0, commitEnd),
    typedDelta: added,
    errorDelta: missed.length,
    missedTargetChars: missed,
  };
}

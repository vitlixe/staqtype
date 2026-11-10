/**
 * Number of input characters that exactly match the target at the same
 * position. Comparison is strict: case, whitespace, tabs and newlines count.
 */
export function countCorrectChars(input: string, target: string): number {
  const limit = Math.min(input.length, target.length);
  let correct = 0;
  for (let i = 0; i < limit; i++) {
    if (input[i] === target[i]) {
      correct++;
    }
  }
  return correct;
}

/** Standard WPM: correct characters / 5 / minutes. Returns 0 for empty input or zero time. */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) {
    return 0;
  }
  const minutes = elapsedMs / 60_000;
  return correctChars / 5 / minutes;
}

/** Accuracy in percent: correct characters / typed characters * 100. 100 when nothing was typed yet. */
export function calculateAccuracy(
  correctChars: number,
  typedChars: number,
): number {
  if (typedChars <= 0) {
    return 100;
  }
  const ratio = Math.max(0, correctChars) / typedChars;
  return Math.min(100, ratio * 100);
}

/** Formats elapsed milliseconds as m:ss. */
export function formatTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

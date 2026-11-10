/** Number of lines in a lesson text. */
export function countLines(text: string): number {
  return text.split("\n").length;
}

/** Visual stand-ins for whitespace so strict checking stays visible. */
export function displayChar(char: string): string {
  switch (char) {
    case " ":
      return "·";
    case "\t":
      return "⇥";
    case "\n":
      return "↵";
    default:
      return char;
  }
}

/** Visible label for a missed key: like displayChar, but space is ␣. */
export function keyLabel(char: string): string {
  return char === " " ? "␣" : displayChar(char);
}

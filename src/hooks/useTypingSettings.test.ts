import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, sanitizeSettings } from "./useTypingSettings";

describe("sanitizeSettings", () => {
  it("falls back to defaults for missing or invalid values", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ tabWidth: 3, codeSize: "xl", autoIndent: "yes" })).toEqual(DEFAULT_SETTINGS);
  });
  it("keeps valid values and ignores old fields", () => {
    expect(
      sanitizeSettings({ stopOnError: false, showKeyboard: true, tabWidth: 4, autoIndent: true, codeSize: "l" }),
    ).toEqual({ stopOnError: false, tabWidth: 4, autoIndent: true, codeSize: "l" });
  });
});

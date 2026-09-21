import { describe, expect, test } from "bun:test";
import { parseLanguage, resolveLocalization } from "../gencow/i18n/language";

describe("language resolution", () => {
  test("defaults to English", () => {
    expect(parseLanguage(undefined)).toBe("en");
  });

  test("uses the requested localization when available", () => {
    const resolved = resolveLocalization(
      [
        { language: "en", title: "English", version: 1 },
        { language: "ko", title: "한국어", version: 1 },
      ],
      "ko",
      "ja",
    );
    expect(resolved.value?.title).toBe("한국어");
    expect(resolved.fallbackUsed).toBe(false);
  });

  test("falls back to the latest English localization", () => {
    const resolved = resolveLocalization(
      [
        { language: "en", title: "Old", version: 1 },
        { language: "en", title: "Current", version: 2 },
      ],
      "ja",
      "ko",
    );
    expect(resolved.value?.title).toBe("Current");
    expect(resolved.resolvedLanguage).toBe("en");
    expect(resolved.fallbackUsed).toBe(true);
  });
});

export const SUPPORTED_LANGUAGES = ["en", "ko", "ja"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type LocalizedRecord = {
  language: string;
  title?: string | null;
  abstract?: string | null;
  description?: string | null;
  content?: string | null;
  text?: string | null;
  reviewStatus?: string | null;
  version?: number | null;
};

export function parseLanguage(value: unknown): Language {
  if (value === undefined || value === null || value === "") return "en";
  if (typeof value !== "string" || !SUPPORTED_LANGUAGES.includes(value as Language)) {
    throw new Error("language must be one of: en, ko, ja");
  }
  return value as Language;
}

export function resolveLocalization<T extends LocalizedRecord>(
  records: T[],
  requestedLanguage: Language,
  originalLanguage: string,
): {
  value?: T;
  requestedLanguage: Language;
  resolvedLanguage: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
  availableLanguages: string[];
} {
  const latest = new Map<string, T>();
  for (const record of records) {
    const previous = latest.get(record.language);
    if (!previous || (record.version ?? 0) > (previous.version ?? 0)) {
      latest.set(record.language, record);
    }
  }

  const availableLanguages = [...latest.keys()].sort();
  const requested = latest.get(requestedLanguage);
  if (requested) {
    return {
      value: requested,
      requestedLanguage,
      resolvedLanguage: requestedLanguage,
      fallbackUsed: false,
      availableLanguages,
    };
  }

  const english = latest.get("en");
  if (english) {
    return {
      value: english,
      requestedLanguage,
      resolvedLanguage: "en",
      fallbackUsed: true,
      fallbackReason: `No ${requestedLanguage} localization is published; English was returned.`,
      availableLanguages,
    };
  }

  return {
    requestedLanguage,
    resolvedLanguage: originalLanguage,
    fallbackUsed: requestedLanguage !== originalLanguage,
    fallbackReason: "No requested or English localization is published; original-language content was returned.",
    availableLanguages,
  };
}

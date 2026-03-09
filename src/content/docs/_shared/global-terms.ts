export const DOC_LANGUAGES = ['js', 'go', 'dart', 'python'] as const;

export type DocLanguage = (typeof DOC_LANGUAGES)[number];

export type LangValue = string | Partial<Record<DocLanguage, string>>;

export type LangTerms = Record<string, LangValue | LangTerms>;

export const GLOBAL_LANG_TERMS = {
  models: {
    geminiFlash: {
      js: 'gemini-2.5-flash',
      go: 'gemini-2.5-flash',
      python: 'gemini-2.5-flash',
      dart: 'gemini-2.5-flash',
    },
  },
} as const;

export function isDocLanguage(value: string): value is DocLanguage {
  return (DOC_LANGUAGES as readonly string[]).includes(value);
}

export function resolvePathValue(source: unknown, pathSegments: string[]): unknown {
  let current = source;
  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || !(segment in (current as Record<string, unknown>))) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function resolveLanguageValue(value: unknown, language: DocLanguage): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const localized = value as Record<string, unknown>;
  const languageValue = localized[language];
  if (typeof languageValue === 'string') {
    return languageValue;
  }

  const defaultValue = localized.default;
  return typeof defaultValue === 'string' ? defaultValue : undefined;
}

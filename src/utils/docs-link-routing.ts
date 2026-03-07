import { docsLanguageAgnosticBySlug, docsLanguageSupportBySlug } from '../sidebar.js';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

export const LANGUAGE_FALLBACK_ORDER = ['js', 'go', 'dart', 'python'] as const;

export type SupportedLanguage = (typeof LANGUAGE_FALLBACK_ORDER)[number];

export type DocsPathMetadata = {
  supportedLanguages: SupportedLanguage[];
  isLanguageAgnostic: boolean;
};

export type DocsPathMetadataMap = Record<string, DocsPathMetadata>;

const INTERNAL_DOCS_URL_BASE = 'https://genkit.dev';
const DOCS_SOURCE_ROOT = path.resolve(process.cwd(), 'src/content/docs/docs');
const LEGACY_PATH_PREFIXES: Array<[prefix: string, replacement: string]> = [
  ['/docs/plugins/', '/docs/integrations/'],
];

export const docsPathMetadata: DocsPathMetadataMap = Object.fromEntries(
  Object.keys(docsLanguageSupportBySlug).map((slug) => {
    const normalizedPath = `/${slug}`;
    const supportedLanguages = (docsLanguageSupportBySlug[slug] || LANGUAGE_FALLBACK_ORDER)
      .filter((value): value is SupportedLanguage =>
        (LANGUAGE_FALLBACK_ORDER as readonly string[]).includes(value),
      );

    return [
      normalizedPath,
      {
        supportedLanguages:
          supportedLanguages.length > 0 ? supportedLanguages : [...LANGUAGE_FALLBACK_ORDER],
        isLanguageAgnostic: Boolean(docsLanguageAgnosticBySlug[slug]),
      },
    ];
  }),
) as DocsPathMetadataMap;

type ParsedDocsUrl = {
  isAbsolute: boolean;
  normalizedPath: string;
  search: string;
  hash: string;
  basePath: string;
  slugPath: string;
  explicitLanguage: SupportedLanguage | null;
};

type ResolvedDocsTarget = {
  resolvedUrl: string;
  wasRewritten: boolean;
  resolvedLanguage: SupportedLanguage | null;
  reason:
    | 'language-agnostic'
    | 'language-supported'
    | 'canonical-fallback'
    | 'unknown-target'
    | 'non-docs';
};

function normalizeDocsPath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
}

function parseDocsUrl(input: string): ParsedDocsUrl | null {
  if (!input) return null;

  const isAbsolute = /^https?:\/\//i.test(input);
  let url: URL;
  try {
    url = new URL(input, INTERNAL_DOCS_URL_BASE);
  } catch {
    return null;
  }

  if (isAbsolute && url.origin !== INTERNAL_DOCS_URL_BASE) {
    return null;
  }

  const normalizedPath = normalizeDocsPath(url.pathname);
  if (!normalizedPath.startsWith('/docs/')) {
    return null;
  }

  const langMatch = normalizedPath.match(/^\/docs\/(js|go|dart|python)\/(.+)$/);
  const slugPath = langMatch ? langMatch[2].replace(/\/+$/, '') : normalizedPath.replace(/^\/docs\//, '');
  if (!slugPath) {
    return null;
  }

  return {
    isAbsolute,
    normalizedPath,
    search: url.search,
    hash: url.hash,
    basePath: `/docs/${slugPath}`,
    slugPath,
    explicitLanguage: (langMatch?.[1] as SupportedLanguage | undefined) || null,
  };
}

function formatResolvedUrl(parsed: ParsedDocsUrl, targetPath: string): string {
  const pathWithSuffix = `${targetPath}${parsed.search}${parsed.hash}`;
  if (parsed.isAbsolute) {
    return `${INTERNAL_DOCS_URL_BASE}${pathWithSuffix}`;
  }
  return pathWithSuffix;
}

function normalizeLegacyDocsBasePath(basePath: string): string {
  for (const [prefix, replacement] of LEGACY_PATH_PREFIXES) {
    if (basePath.startsWith(prefix)) {
      return `${replacement}${basePath.slice(prefix.length)}`;
    }
  }
  return basePath;
}

function parseSupportedLanguagesFromSource(source: string): SupportedLanguage[] {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (frontmatterMatch) {
    try {
      const frontmatter = parse(frontmatterMatch[1]) as { supportedLanguages?: unknown };
      if (Array.isArray(frontmatter.supportedLanguages)) {
        const languages = frontmatter.supportedLanguages
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.toLowerCase())
          .filter((value): value is SupportedLanguage =>
            (LANGUAGE_FALLBACK_ORDER as readonly string[]).includes(value),
          );
        if (languages.length > 0) {
          return [...new Set(languages)];
        }
      }
    } catch {
      // Ignore parse issues and fall back to content inspection.
    }
  }

  const contentLanguages = new Set<SupportedLanguage>();
  const languageContentPattern = /<Lang[^>]*lang\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  let match = languageContentPattern.exec(source);
  while (match) {
    const values = (match[1] || match[2] || '')
      .trim()
      .split(/\s+/)
      .map((value) => value.toLowerCase())
      .filter((value): value is SupportedLanguage =>
        (LANGUAGE_FALLBACK_ORDER as readonly string[]).includes(value),
      );
    values.forEach((value) => contentLanguages.add(value));
    match = languageContentPattern.exec(source);
  }

  if (contentLanguages.size > 0) {
    return LANGUAGE_FALLBACK_ORDER.filter((language) => contentLanguages.has(language));
  }

  return [...LANGUAGE_FALLBACK_ORDER];
}

function parseIsLanguageAgnosticFromSource(source: string): boolean {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) return false;

  try {
    const frontmatter = parse(frontmatterMatch[1]) as { isLanguageAgnostic?: unknown };
    return frontmatter.isLanguageAgnostic === true;
  } catch {
    return false;
  }
}

function findMetadataFromSource(basePath: string): DocsPathMetadata | null {
  const slugPath = basePath.replace(/^\/docs\//, '');
  const candidates = [
    path.join(DOCS_SOURCE_ROOT, `${slugPath}.mdx`),
    path.join(DOCS_SOURCE_ROOT, `${slugPath}.md`),
  ];
  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!sourcePath) {
    return null;
  }

  const source = fs.readFileSync(sourcePath, 'utf8');
  return {
    supportedLanguages: parseSupportedLanguagesFromSource(source),
    isLanguageAgnostic: parseIsLanguageAgnosticFromSource(source),
  };
}

function chooseCanonicalLanguage(supportedLanguages: SupportedLanguage[]): SupportedLanguage | null {
  return LANGUAGE_FALLBACK_ORDER.find((language) => supportedLanguages.includes(language)) || null;
}

export function resolveDocsTarget(
  input: string,
  activeLanguage: SupportedLanguage,
  metadataByPath: DocsPathMetadataMap = docsPathMetadata,
): ResolvedDocsTarget {
  const parsed = parseDocsUrl(input);
  if (!parsed) {
    return {
      resolvedUrl: input,
      wasRewritten: false,
      resolvedLanguage: null,
      reason: 'non-docs',
    };
  }

  const normalizedBasePath = normalizeLegacyDocsBasePath(parsed.basePath);
  const metadata = metadataByPath[normalizedBasePath] || findMetadataFromSource(normalizedBasePath);
  if (!metadata) {
    return {
      resolvedUrl: input,
      wasRewritten: false,
      resolvedLanguage: null,
      reason: 'unknown-target',
    };
  }

  const { supportedLanguages, isLanguageAgnostic } = metadata;
  if (isLanguageAgnostic) {
    const targetPath = `${normalizedBasePath}/`;
    return {
      resolvedUrl: formatResolvedUrl(parsed, targetPath),
      wasRewritten: normalizeDocsPath(targetPath) !== parsed.normalizedPath,
      resolvedLanguage: null,
      reason: 'language-agnostic',
    };
  }

  if (supportedLanguages.includes(activeLanguage)) {
    const normalizedSlugPath = normalizedBasePath.replace(/^\/docs\//, '');
    const targetPath = `/docs/${activeLanguage}/${normalizedSlugPath}/`;
    return {
      resolvedUrl: formatResolvedUrl(parsed, targetPath),
      wasRewritten: normalizeDocsPath(targetPath) !== parsed.normalizedPath,
      resolvedLanguage: activeLanguage,
      reason: 'language-supported',
    };
  }

  const canonicalLanguage = chooseCanonicalLanguage(supportedLanguages);
  if (!canonicalLanguage) {
    return {
      resolvedUrl: input,
      wasRewritten: false,
      resolvedLanguage: null,
      reason: 'unknown-target',
    };
  }

  const normalizedSlugPath = normalizedBasePath.replace(/^\/docs\//, '');
  const targetPath = `/docs/${canonicalLanguage}/${normalizedSlugPath}/`;
  return {
    resolvedUrl: formatResolvedUrl(parsed, targetPath),
    wasRewritten: normalizeDocsPath(targetPath) !== parsed.normalizedPath,
    resolvedLanguage: canonicalLanguage,
    reason: 'canonical-fallback',
  };
}

type RewriteOptions = {
  context?: string;
  warnOnUnresolved?: boolean;
  warnOnCrossLanguageTargets?: boolean;
  rewriteHashLinks?: boolean;
};

export function rewriteInternalDocsLinks(
  content: string,
  activeLanguage: SupportedLanguage,
  metadataByPath: DocsPathMetadataMap = docsPathMetadata,
  options: RewriteOptions = {},
): string {
  const warnings: string[] = [];
  const crossLanguageWarnings: string[] = [];
  const warnUnresolved = Boolean(options.warnOnUnresolved);
  const warnOnCrossLanguageTargets = Boolean(options.warnOnCrossLanguageTargets);
  const rewriteHashLinks = Boolean(options.rewriteHashLinks);

  const rewriteIfNeeded = (originalUrl: string): string => {
    const parsed = parseDocsUrl(originalUrl);
    const resolved = resolveDocsTarget(originalUrl, activeLanguage, metadataByPath);

    if (
      warnOnCrossLanguageTargets &&
      parsed &&
      resolved.resolvedLanguage &&
      resolved.resolvedLanguage !== activeLanguage
    ) {
      crossLanguageWarnings.push(`${originalUrl} -> ${resolved.resolvedUrl}`);
    }

    if (!rewriteHashLinks && originalUrl.includes('#')) {
      return originalUrl;
    }
    if (
      warnUnresolved &&
      (resolved.reason === 'unknown-target' || resolved.reason === 'non-docs')
      && /^https?:\/\/genkit\.dev\/docs\/|^\/docs\//.test(originalUrl)
    ) {
      warnings.push(originalUrl);
    }
    return resolved.resolvedUrl;
  };

  let rewritten = content;

  // Markdown links/images where target starts with /docs or https://genkit.dev/docs
  rewritten = rewritten.replace(
    /(\]\()((?:https?:\/\/genkit\.dev)?\/docs\/[^)\s]+)(\))/g,
    (_full, prefix: string, url: string, suffix: string) => {
      return `${prefix}${rewriteIfNeeded(url)}${suffix}`;
    },
  );

  // Inline HTML href attributes.
  rewritten = rewritten.replace(
    /(href=['"])((?:https?:\/\/genkit\.dev)?\/docs\/[^'"]+)(['"])/g,
    (_full, prefix: string, url: string, suffix: string) => {
      return `${prefix}${rewriteIfNeeded(url)}${suffix}`;
    },
  );

  if (warnings.length > 0) {
    const unique = [...new Set(warnings)];
    const contextPrefix = options.context ? `${options.context}: ` : '';
    console.warn(
      `${contextPrefix}Found unresolved internal docs links while rewriting for language "${activeLanguage}": ${unique.join(', ')}`,
    );
  }

  if (crossLanguageWarnings.length > 0) {
    const unique = [...new Set(crossLanguageWarnings)];
    const contextPrefix = options.context ? `${options.context}: ` : '';
    console.warn(
      `${contextPrefix}Found cross-language internal docs links for "${activeLanguage}" pages (target language differs): ${unique.join(', ')}`,
    );
  }

  return rewritten;
}

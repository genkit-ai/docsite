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
const GUIDES_SOURCE_ROOT = path.resolve(process.cwd(), 'src/content/docs/guides');
const GENERATED_LANGUAGE_DIRS = new Set(LANGUAGE_FALLBACK_ORDER);
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
  section: 'docs' | 'guides';
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
  const isDocsPath = normalizedPath.startsWith('/docs/');
  const isGuidesPath = normalizedPath.startsWith('/guides/');
  if (!isDocsPath && !isGuidesPath) {
    return null;
  }

  const section: 'docs' | 'guides' = isGuidesPath ? 'guides' : 'docs';
  const prefix = `/${section}/`;

  const langMatch = normalizedPath.match(new RegExp(`^/${section}/(js|go|dart|python)/(.+)$`));
  const slugPath = langMatch ? langMatch[2].replace(/\/+$/, '') : normalizedPath.replace(new RegExp(`^/${section}/`), '');
  if (!slugPath) {
    return null;
  }

  return {
    isAbsolute,
    normalizedPath,
    search: url.search,
    hash: url.hash,
    basePath: `/${section}/${slugPath}`,
    slugPath,
    section,
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

export function findMetadataFromSource(basePath: string): DocsPathMetadata | null {
  // Determine which source root to use based on path prefix
  let sourceRoot: string;
  let slugPath: string;
  if (basePath.startsWith('/guides/')) {
    sourceRoot = GUIDES_SOURCE_ROOT;
    slugPath = basePath.replace(/^\/guides\//, '');
  } else {
    sourceRoot = DOCS_SOURCE_ROOT;
    slugPath = basePath.replace(/^\/docs\//, '');
  }

  const candidates = [
    path.join(sourceRoot, `${slugPath}.mdx`),
    path.join(sourceRoot, `${slugPath}.md`),
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

export function chooseCanonicalLanguage(supportedLanguages: SupportedLanguage[]): SupportedLanguage | null {
  return LANGUAGE_FALLBACK_ORDER.find((language) => supportedLanguages.includes(language)) || null;
}

function collectSourceDocFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (GENERATED_LANGUAGE_DIRS.has(entry.name as SupportedLanguage)) {
        continue;
      }
      files.push(...collectSourceDocFiles(path.join(dir, entry.name)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

export function getAllSourceDocsPathMetadata(): DocsPathMetadataMap {
  const metadataEntries: Array<readonly [string, DocsPathMetadata]> = [];

  // Collect from docs source
  for (const filePath of collectSourceDocFiles(DOCS_SOURCE_ROOT)) {
    const relativePath = path.relative(DOCS_SOURCE_ROOT, filePath).replace(/\\/g, '/');
    const slugPath = relativePath.replace(/\.(md|mdx)$/, '');
    const source = fs.readFileSync(filePath, 'utf8');
    metadataEntries.push([
      `/docs/${slugPath}`,
      {
        supportedLanguages: parseSupportedLanguagesFromSource(source),
        isLanguageAgnostic: parseIsLanguageAgnosticFromSource(source),
      },
    ]);
  }

  // Collect from guides source
  for (const filePath of collectSourceDocFiles(GUIDES_SOURCE_ROOT)) {
    const relativePath = path.relative(GUIDES_SOURCE_ROOT, filePath).replace(/\\/g, '/');
    const slugPath = relativePath.replace(/\.(md|mdx)$/, '');
    const source = fs.readFileSync(filePath, 'utf8');
    metadataEntries.push([
      `/guides/${slugPath}`,
      {
        supportedLanguages: parseSupportedLanguagesFromSource(source),
        isLanguageAgnostic: parseIsLanguageAgnosticFromSource(source),
      },
    ]);
  }

  metadataEntries.sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(metadataEntries) as DocsPathMetadataMap;
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

  const section = parsed.section;

  if (supportedLanguages.includes(activeLanguage)) {
    const normalizedSlugPath = normalizedBasePath.replace(new RegExp(`^/${section}/`), '');
    const targetPath = `/${section}/${activeLanguage}/${normalizedSlugPath}/`;
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

  const normalizedSlugPath = normalizedBasePath.replace(new RegExp(`^/${section}/`), '');
  const targetPath = `/${section}/${canonicalLanguage}/${normalizedSlugPath}/`;
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
      && /^https?:\/\/genkit\.dev\/(docs|guides)\/|^\/(docs|guides)\//.test(originalUrl)
    ) {
      warnings.push(originalUrl);
    }
    return resolved.resolvedUrl;
  };

  let rewritten = content;

  // Markdown links/images where target starts with /docs, /guides, or https://genkit.dev/docs, https://genkit.dev/guides
  rewritten = rewritten.replace(
    /(\]\()((?:https?:\/\/genkit\.dev)?\/(?:docs|guides)\/[^)\s]+)(\))/g,
    (_full, prefix: string, url: string, suffix: string) => {
      return `${prefix}${rewriteIfNeeded(url)}${suffix}`;
    },
  );

  // Inline HTML href attributes.
  rewritten = rewritten.replace(
    /(href=['"])((?:https?:\/\/genkit\.dev)?\/(?:docs|guides)\/[^'"]+)(['"])/g,
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

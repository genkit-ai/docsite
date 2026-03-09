import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, stringify } from 'yaml';
import { rewriteInternalDocsLinks } from '../utils/docs-link-routing.js';
import {
  DOC_LANGUAGES,
  GLOBAL_LANG_TERMS,
  resolveLanguageValue,
  resolvePathValue,
} from '../content/docs/_shared/global-terms.js';

const SOURCE_ROOT = path.resolve('src/content/docs/docs');
const OUTPUT_ROOT = path.resolve('src/content/docs/docs');
const LANGUAGES = [...DOC_LANGUAGES] as const;
const FALLBACK_LANGUAGES = ['js', 'go', 'dart', 'python'] as const;
const MIN_LANGUAGE_CONTENT_CHARS_WARNING = 120;
const DUPLICATE_PROSE_MIN_CHARS = 140;
const DUPLICATE_PROSE_WARNING_SIMILARITY = 0.82;
const DUPLICATE_PROSE_HIGH_CONFIDENCE_SIMILARITY = 0.93;
const TEMPLATE_TOKEN_REGEX = /\[\[\s*([^[\]]+?)\s*\]\]/g;
const GLOBAL_TOKEN_REGEX = /\[\[\s*@global\.([^[\]]+?)\s*\]\]/g;

type Language = (typeof LANGUAGES)[number];
const KNOWN_LANGUAGES = new Set<string>(LANGUAGES);
const FENCE_TO_LANGUAGE: Record<string, Language> = {
  js: 'js',
  javascript: 'js',
  jsx: 'js',
  mjs: 'js',
  cjs: 'js',
  ts: 'js',
  typescript: 'js',
  tsx: 'js',
  go: 'go',
  golang: 'go',
  dart: 'dart',
  py: 'python',
  python: 'python',
};
type LanguageBlockNode = {
  langs: string[];
  attrs: string;
  openStart: number;
  openEnd: number;
  closeStart: number;
  closeEnd: number;
  children: LanguageBlockNode[];
};

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && (fullPath.endsWith('.md') || fullPath.endsWith('.mdx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function splitFrontmatter(source: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, body: source };
  }
  return {
    frontmatter: (parse(match[1]) as Record<string, unknown>) || {},
    body: source.slice(match[0].length),
  };
}

function getSupportedLanguages(frontmatter: Record<string, unknown>): Language[] {
  const declared = Array.isArray(frontmatter.supportedLanguages)
    ? frontmatter.supportedLanguages.filter((value): value is string => typeof value === 'string')
    : [];
  const normalized = declared.map((value) => value.toLowerCase()).filter((value): value is Language => LANGUAGES.includes(value as Language));
  if (normalized.length > 0) {
    return LANGUAGES.filter((lang) => normalized.includes(lang));
  }
  return [...FALLBACK_LANGUAGES];
}

function parseLanguageBlocks(source: string): LanguageBlockNode[] {
  const tagRegex = /<(\/?)(Lang)\b([^>]*)>/g;
  const stack: Array<LanguageBlockNode & { tagName: string }> = [];
  const roots: LanguageBlockNode[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(source)) !== null) {
    const [fullTag, closingSlash, tagName, attrs] = match;
    const isClosing = closingSlash === '/';
    const tagStart = match.index;
    const tagEnd = match.index + fullTag.length;

    if (!isClosing) {
      const langMatch = attrs.match(/\blang\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
      if (!langMatch) {
        continue;
      }
      const langs = (langMatch[1] || langMatch[2] || '')
        .split(/\s+/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      const node: LanguageBlockNode & { tagName: string } = {
        langs,
        attrs,
        openStart: tagStart,
        openEnd: tagEnd,
        closeStart: tagEnd,
        closeEnd: tagEnd,
        children: [],
        tagName,
      };
      stack.push(node);
      continue;
    }

    let openNodeIndex = -1;
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      if (stack[i].tagName === tagName) {
        openNodeIndex = i;
        break;
      }
    }
    if (openNodeIndex === -1) {
      continue;
    }

    const node = stack.splice(openNodeIndex, 1)[0];
    node.closeStart = tagStart;
    node.closeEnd = tagEnd;
    const finalized: LanguageBlockNode = {
      langs: node.langs,
      attrs: node.attrs,
      openStart: node.openStart,
      openEnd: node.openEnd,
      closeStart: node.closeStart,
      closeEnd: node.closeEnd,
      children: node.children,
    };

    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(finalized);
    } else {
      roots.push(finalized);
    }
  }

  return roots.sort((a, b) => a.openStart - b.openStart);
}

function flattenLanguageBlocks(nodes: LanguageBlockNode[]): LanguageBlockNode[] {
  const flattened: LanguageBlockNode[] = [];
  for (const node of nodes) {
    flattened.push(node);
    if (node.children.length > 0) {
      flattened.push(...flattenLanguageBlocks(node.children));
    }
  }
  return flattened;
}

function getLineNumber(source: string, offset: number): number {
  if (offset <= 0) return 1;
  return source.slice(0, offset).split('\n').length;
}

function validateLanguageBlocks(
  body: string,
  supportedLanguages: Language[],
  filePath: string,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blocks = flattenLanguageBlocks(parseLanguageBlocks(body));
  if (blocks.length === 0) {
    return { errors, warnings };
  }

  const supportedSet = new Set<string>(supportedLanguages);
  const fileRelativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  for (const block of blocks) {
    const line = getLineNumber(body, block.openStart);
    for (const lang of block.langs) {
      if (!KNOWN_LANGUAGES.has(lang)) {
        errors.push(
          `${fileRelativePath}:${line} uses unknown Lang language "${lang}" (allowed: ${LANGUAGES.join(', ')}).`,
        );
        continue;
      }

      if (!supportedSet.has(lang)) {
        errors.push(
          `${fileRelativePath}:${line} uses Lang language "${lang}" not listed in supportedLanguages [${supportedLanguages.join(', ')}].`,
        );
      }
    }

    if (block.langs.length !== 1 || !KNOWN_LANGUAGES.has(block.langs[0])) {
      continue;
    }

    const blockLanguage = block.langs[0] as Language;
    const blockContent = body.slice(block.openEnd, block.closeStart);
    const codeFenceRegex = /(^|\n)[ \t]*```([^\n`]*)/g;
    let fenceMatch: RegExpExecArray | null;
    while ((fenceMatch = codeFenceRegex.exec(blockContent)) !== null) {
      const rawFenceInfo = (fenceMatch[2] || '').trim();
      if (!rawFenceInfo) {
        continue;
      }
      const label = rawFenceInfo.split(/[\s{]/)[0].toLowerCase();
      const codeLanguage = FENCE_TO_LANGUAGE[label];
      if (!codeLanguage || codeLanguage === blockLanguage) {
        continue;
      }
      const absoluteFenceOffset = block.openEnd + fenceMatch.index + (fenceMatch[1] ? fenceMatch[1].length : 0);
      const fenceLine = getLineNumber(body, absoluteFenceOffset);
      warnings.push(
        `${fileRelativePath}:${fenceLine} has \`\`\`${label} inside <Lang lang="${blockLanguage}">.`,
      );
    }
  }

  return { errors, warnings };
}

function stripCodeFences(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '');
}

function normalizeProse(content: string): string {
  return stripCodeFences(content)
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[_*~>#-]/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSimilarity(left: string, right: string): number {
  const leftTokens = new Set(left.split(' ').filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(' ').filter((token) => token.length > 2));
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function collectDuplicateLangWarnings(
  body: string,
  nodes: LanguageBlockNode[],
  filePath: string,
  warnings: string[],
): void {
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const left = nodes[i];
    const right = nodes[i + 1];
    if (left.langs.length !== 1 || right.langs.length !== 1 || left.langs[0] === right.langs[0]) {
      continue;
    }

    const leftContent = normalizeProse(body.slice(left.openEnd, left.closeStart));
    const rightContent = normalizeProse(body.slice(right.openEnd, right.closeStart));
    if (
      leftContent.length < DUPLICATE_PROSE_MIN_CHARS ||
      rightContent.length < DUPLICATE_PROSE_MIN_CHARS
    ) {
      continue;
    }

    const similarity = tokenSimilarity(leftContent, rightContent);
    if (similarity < DUPLICATE_PROSE_WARNING_SIMILARITY) {
      continue;
    }

    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const line = getLineNumber(body, left.openStart);
    const confidence =
      similarity >= DUPLICATE_PROSE_HIGH_CONFIDENCE_SIMILARITY
        ? 'high-confidence'
        : 'possible';
    warnings.push(
      `${relativePath}:${line} ${confidence} duplicated prose between <Lang lang="${left.langs[0]}"> and <Lang lang="${right.langs[0]}"> (similarity=${similarity.toFixed(
        2,
      )}). Consider language-neutral prose or <Lang terms={...}>.`,
    );
  }

  for (const node of nodes) {
    if (node.children.length > 0) {
      collectDuplicateLangWarnings(body, node.children, filePath, warnings);
    }
  }
}

function extractTermsExpression(attributes: string): string | undefined {
  const termsMatch = attributes.match(/\bterms\s*=\s*\{/);
  if (!termsMatch) {
    return undefined;
  }

  const start = termsMatch.index! + termsMatch[0].length - 1;
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = start; i < attributes.length; i += 1) {
    const char = attributes[i];
    const prev = i > 0 ? attributes[i - 1] : '';

    if (char === "'" && !inDoubleQuote && prev !== '\\') {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && prev !== '\\') {
      inDoubleQuote = !inDoubleQuote;
    }

    if (inSingleQuote || inDoubleQuote) {
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return attributes.slice(start + 1, i);
      }
    }
  }

  return undefined;
}

function parseTerms(attributes: string): { terms: Record<string, unknown>; error?: string } {
  const expression = extractTermsExpression(attributes);
  if (!expression) {
    return { terms: {} };
  }

  try {
    const parsed = JSON.parse(expression);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { terms: {}, error: 'terms must be a JSON object literal.' };
    }
    return { terms: parsed as Record<string, unknown> };
  } catch (error) {
    return {
      terms: {},
      error: `Could not parse terms JSON expression: ${(error as Error).message}`,
    };
  }
}

function resolveTemplateToken(
  token: string,
  language: Language,
  terms: Record<string, unknown>,
): string | undefined {
  const trimmed = token.trim();
  if (trimmed.startsWith('@global.')) {
    const pathSegments = trimmed
      .slice('@global.'.length)
      .split('.')
      .map((segment) => segment.trim())
      .filter(Boolean);
    const globalValue = resolvePathValue(GLOBAL_LANG_TERMS, pathSegments);
    return resolveLanguageValue(globalValue, language);
  }

  const pathSegments = trimmed.split('.').map((segment) => segment.trim()).filter(Boolean);
  const scopedValue =
    pathSegments.length > 1 ? resolvePathValue(terms, pathSegments) : terms[trimmed];
  return resolveLanguageValue(scopedValue, language);
}

type LangWarningContext = {
  warnings: string[];
  filePath: string;
};

function validateLangTermTokens(
  body: string,
  nodes: LanguageBlockNode[],
  context: LangWarningContext,
): void {
  const relativePath = path.relative(process.cwd(), context.filePath).replace(/\\/g, '/');

  const visit = (blockNodes: LanguageBlockNode[]): void => {
    for (const block of blockNodes) {
      const startLine = getLineNumber(body, block.openStart);
      const { terms, error } = parseTerms(block.attrs);
      if (error) {
        context.warnings.push(`${relativePath}:${startLine} ${error}`);
      }

      const knownLangs = block.langs.filter((lang): lang is Language => KNOWN_LANGUAGES.has(lang));
      const content = body.slice(block.openEnd, block.closeStart);
      const tokens = Array.from(
        new Set(
          [...content.matchAll(TEMPLATE_TOKEN_REGEX)]
            .map((tokenMatch) => tokenMatch[1]?.trim())
            .filter((token): token is string => Boolean(token)),
        ),
      );
      for (const token of tokens) {
        for (const language of knownLangs) {
          if (resolveTemplateToken(token, language, terms) !== undefined) {
            continue;
          }
          context.warnings.push(
            `${relativePath}:${startLine} Lang token "[[${token}]]" has no value for "${language}" in this block.`,
          );
        }
      }

      if (block.children.length > 0) {
        visit(block.children);
      }
    }
  };

  visit(nodes);
}

function replaceGlobalTokens(
  content: string,
  language: Language,
  context: LangWarningContext,
): string {
  const relativePath = path.relative(process.cwd(), context.filePath).replace(/\\/g, '/');
  return content.replace(GLOBAL_TOKEN_REGEX, (_full, pathExpression: string) => {
    const pathSegments = pathExpression
      .split('.')
      .map((segment) => segment.trim())
      .filter(Boolean);
    const resolved = resolveLanguageValue(resolvePathValue(GLOBAL_LANG_TERMS, pathSegments), language);
    if (resolved !== undefined) {
      return resolved;
    }

    context.warnings.push(
      `${relativePath} global token "[[@global.${pathExpression}]]" has no value for "${language}".`,
    );
    return `[[@global.${pathExpression}]]`;
  });
}

function renderLangTokensForLanguage(
  content: string,
  terms: Record<string, unknown>,
  language: Language,
): string {
  return content.replace(TEMPLATE_TOKEN_REGEX, (_placeholder, token: string) => {
    const resolved = resolveTemplateToken(token, language, terms);
    return resolved !== undefined ? resolved : `[[${token.trim()}]]`;
  });
}

function renderLanguageSegment(
  source: string,
  nodes: LanguageBlockNode[],
  start: number,
  end: number,
  language: Language,
  context: LangWarningContext,
): string {
  let cursor = start;
  let output = '';

  for (const node of nodes) {
    if (node.openStart < start || node.closeEnd > end) {
      continue;
    }

    output += source.slice(cursor, node.openStart);
    if (node.langs.includes(language)) {
      const nested = renderLanguageSegment(
        source,
        node.children,
        node.openEnd,
        node.closeStart,
        language,
        context,
      );
      const { terms, error } = parseTerms(node.attrs);
      if (error) {
        const relativePath = path.relative(process.cwd(), context.filePath).replace(/\\/g, '/');
        const line = getLineNumber(source, node.openStart);
        context.warnings.push(`${relativePath}:${line} ${error}`);
        output += nested;
      } else {
        output += renderLangTokensForLanguage(nested, terms, language);
      }
    }
    cursor = node.closeEnd;
  }

  output += source.slice(cursor, end);
  return output;
}

function validateGlobalTokens(
  body: string,
  supportedLanguages: Language[],
  context: LangWarningContext,
): void {
  const relativePath = path.relative(process.cwd(), context.filePath).replace(/\\/g, '/');
  const globalTokens = Array.from(
    new Set(
      [...body.matchAll(GLOBAL_TOKEN_REGEX)]
        .map((matchToken) => matchToken[1]?.trim())
        .filter((token): token is string => Boolean(token)),
    ),
  );
  for (const globalToken of globalTokens) {
    const pathSegments = globalToken.split('.').map((segment) => segment.trim()).filter(Boolean);
    for (const language of supportedLanguages) {
      if (resolveLanguageValue(resolvePathValue(GLOBAL_LANG_TERMS, pathSegments), language) !== undefined) {
        continue;
      }
      context.warnings.push(
        `${relativePath} global token "[[@global.${globalToken}]]" has no value for "${language}".`,
      );
    }
  }
}

function resolveBodyForLanguage(
  body: string,
  language: Language,
  context: LangWarningContext,
): string {
  const blocks = parseLanguageBlocks(body);
  const rendered = renderLanguageSegment(body, blocks, 0, body.length, language, context);
  return replaceGlobalTokens(rendered, language, context);
}

function renderBodyForLanguage(
  body: string,
  language: Language,
  context: LangWarningContext,
): string {
  let rendered = body;

  rendered = rendered.replace(/^import\s+Lang\s+from\s+['"][^'"]+['"];?\n/gm, '');
  rendered = rendered.replace(/^import\s+CopyMarkdownButton\s+from\s+['"][^'"]+['"];?\n/gm, '');

  rendered = rendered.replace(
    /<div[^>]*style="[^"]*display:\s*flex[^"]*justify-content:\s*space-between[^"]*">[\s\S]*?<\/div>\s*/g,
    '',
  );

  rendered = resolveBodyForLanguage(rendered, language, context);
  rendered = rewriteInternalDocsLinks(rendered, language, undefined, {
    context: 'generate-language-pages',
    warnOnUnresolved: true,
    warnOnCrossLanguageTargets: true,
  });

  rendered = rendered.replace(/\n{3,}/g, '\n\n').trim();
  return `${rendered}\n`;
}

function getMeaningfulContentCharCount(content: string): number {
  return content.replace(/\s+/g, '').length;
}

function slugFromSourcePath(filePath: string): string {
  const rel = path.relative(SOURCE_ROOT, filePath).replace(/\\/g, '/');
  return rel.replace(/\.(md|mdx)$/, '');
}

function rewriteRelativeAssetPaths(
  value: unknown,
  sourceFilePath: string,
  outputFilePath: string,
): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('../')) {
      const resolvedSourcePath = path.resolve(path.dirname(sourceFilePath), value);
      if (resolvedSourcePath.includes(`${path.sep}src${path.sep}assets${path.sep}`)) {
        let rel = path.relative(path.dirname(outputFilePath), resolvedSourcePath).replace(/\\/g, '/');
        if (!rel.startsWith('.')) {
          rel = `./${rel}`;
        }
        return rel;
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteRelativeAssetPaths(item, sourceFilePath, outputFilePath));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        rewriteRelativeAssetPaths(nested, sourceFilePath, outputFilePath),
      ]),
    );
  }

  return value;
}

function rewriteBodyAssetPaths(body: string, sourceFilePath: string, outputFilePath: string): string {
  const rewriteRelativePath = (relativeRef: string): string => {
    if (!relativeRef.startsWith('./') && !relativeRef.startsWith('../')) {
      return relativeRef;
    }

    const [pathname, suffix = ''] = relativeRef.split(/([?#].*)/, 2);
    const resolvedSourcePath = path.resolve(path.dirname(sourceFilePath), pathname);
    let rel = path.relative(path.dirname(outputFilePath), resolvedSourcePath).replace(/\\/g, '/');
    if (!rel.startsWith('.')) {
      rel = `./${rel}`;
    }
    return `${rel}${suffix}`;
  };

  let rewritten = body;

  // ESM-style imports in MDX frontmatter/body.
  rewritten = rewritten.replace(
    /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
    (_full, prefix, rel, suffix) => `${prefix}${rewriteRelativePath(rel)}${suffix}`,
  );

  // Markdown links and images: [text](../path) / ![alt](../path)
  rewritten = rewritten.replace(
    /(\]\()(\.\.?\/[^)\s]+)(\))/g,
    (_full, prefix, rel, suffix) => `${prefix}${rewriteRelativePath(rel)}${suffix}`,
  );

  // HTML src/href attributes in inline HTML.
  rewritten = rewritten.replace(
    /((?:src|href)=['"])(\.\.?\/[^'"]+)(['"])/g,
    (_full, prefix, rel, suffix) => `${prefix}${rewriteRelativePath(rel)}${suffix}`,
  );

  return rewritten;
}

function buildGeneratedFileNotice(sourceFilePath: string, extension: 'md' | 'mdx'): string {
  const sourceRelativePath = path.relative(process.cwd(), sourceFilePath).replace(/\\/g, '/');
  const lines = [
    'AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.',
    `Edit the source document instead: ${sourceRelativePath}`,
    'Then run: pnpm generate-language-pages',
  ];
  if (extension === 'mdx') {
    return `{/* ${lines.join(' ')} */}`;
  }
  return `<!--\n${lines.join('\n')}\n-->`;
}

async function generate(): Promise<void> {
  const validationErrors: string[] = [];
  const languageCodeWarnings: string[] = [];
  const sizeWarnings: string[] = [];
  const duplicationWarnings: string[] = [];
  const langTermsWarnings: string[] = [];

  for (const language of LANGUAGES) {
    await rm(path.join(OUTPUT_ROOT, language), { recursive: true, force: true });
    await mkdir(path.join(OUTPUT_ROOT, language), { recursive: true });
  }

  const sourceFiles = await walk(SOURCE_ROOT);
  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, 'utf8');
    const { frontmatter, body } = splitFrontmatter(source);
    const isLanguageAgnostic = Boolean(frontmatter.isLanguageAgnostic);
    const supportedLanguages = getSupportedLanguages(frontmatter);
    const blockValidation = validateLanguageBlocks(body, supportedLanguages, filePath);
    validationErrors.push(...blockValidation.errors);
    languageCodeWarnings.push(...blockValidation.warnings);
    const languageBlockRoots = parseLanguageBlocks(body);
    collectDuplicateLangWarnings(body, languageBlockRoots, filePath, duplicationWarnings);
    const termsWarningContext = {
      warnings: langTermsWarnings,
      filePath,
    };
    validateLangTermTokens(body, languageBlockRoots, termsWarningContext);
    validateGlobalTokens(body, supportedLanguages, termsWarningContext);
    const fileRelativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const renderedByLanguage = new Map<Language, string>();
    for (const language of supportedLanguages) {
      const rendered = renderBodyForLanguage(body, language, termsWarningContext);
      renderedByLanguage.set(language, rendered);
      const charCount = getMeaningfulContentCharCount(rendered);
      if (charCount === 0) {
        sizeWarnings.push(
          `${fileRelativePath} declares "${language}" in supportedLanguages but rendered content is empty.`,
        );
        continue;
      }
      if (charCount < MIN_LANGUAGE_CONTENT_CHARS_WARNING) {
        sizeWarnings.push(
          `${fileRelativePath} declares "${language}" in supportedLanguages but rendered content is very small (${charCount} non-whitespace chars).`,
        );
      }
    }
    if (isLanguageAgnostic) {
      continue;
    }
    const slug = slugFromSourcePath(filePath);
    const extension = filePath.endsWith('.mdx') ? 'mdx' : 'md';

    for (const language of supportedLanguages) {
      const outputPath = path.join(OUTPUT_ROOT, language, `${slug}.${extension}`);
      const languageFrontmatter = rewriteRelativeAssetPaths(
        {
          ...frontmatter,
          supportedLanguages: [language],
        },
        filePath,
        outputPath,
      ) as Record<string, unknown>;
      const renderedBody = rewriteBodyAssetPaths(
        renderedByLanguage.get(language) || renderBodyForLanguage(body, language, termsWarningContext),
        filePath,
        outputPath,
      );
      const generatedNotice = buildGeneratedFileNotice(filePath, extension);
      const outputContent = `---\n${stringify(languageFrontmatter).trimEnd()}\n---\n\n${generatedNotice}\n\n${renderedBody}`;
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, outputContent);
    }
  }

  if (validationErrors.length > 0) {
    console.error(
      [
        'generate-language-pages: Lang/supportedLanguages validation failed.',
        ...validationErrors.map((error) => `- ${error}`),
      ].join('\n'),
    );
    throw new Error(`Found ${validationErrors.length} Lang/supportedLanguages validation error(s).`);
  }

  if (sizeWarnings.length > 0) {
    console.warn(
      [
        'generate-language-pages: Found pages with empty/very-small content for declared supportedLanguages:',
        ...sizeWarnings.map((warning) => `- ${warning}`),
      ].join('\n'),
    );
  }

  if (languageCodeWarnings.length > 0) {
    console.warn(
      [
        'generate-language-pages: Found possible code-fence language mismatches inside Lang blocks:',
        ...languageCodeWarnings.map((warning) => `- ${warning}`),
      ].join('\n'),
    );
  }

  if (duplicationWarnings.length > 0) {
    console.warn(
      [
        'generate-language-pages: Found possible duplicated prose across sibling Lang blocks:',
        ...duplicationWarnings.map((warning) => `- ${warning}`),
      ].join('\n'),
    );
  }

  if (langTermsWarnings.length > 0) {
    console.warn(
      [
        'generate-language-pages: Found Lang terms mapping issues:',
        ...langTermsWarnings.map((warning) => `- ${warning}`),
      ].join('\n'),
    );
  }

  console.log(`Generated language-specific pages in ${OUTPUT_ROOT}/{js,go,dart,python}`);
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

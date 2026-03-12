import { watch } from 'node:fs';
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, stringify } from 'yaml';
import { rewriteInternalDocsLinks } from '../utils/docs-link-routing.js';

const SOURCE_ROOT = path.resolve('src/content/docs/docs');
const OUTPUT_ROOT = path.resolve('src/content/docs/docs');
const LANGUAGES = ['js', 'go', 'dart', 'python'] as const;
const FALLBACK_LANGUAGES = ['js', 'go', 'dart', 'python'] as const;
const MIN_LANGUAGE_CONTENT_CHARS_WARNING = 120;
const WATCH_DEBOUNCE_MS = 160;

type Language = (typeof LANGUAGES)[number];
const KNOWN_LANGUAGES = new Set<string>(LANGUAGES);
const GENERATED_LANGUAGE_DIRS = new Set<string>(LANGUAGES);
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
  openStart: number;
  openEnd: number;
  closeStart: number;
  closeEnd: number;
  children: LanguageBlockNode[];
};

type GenerateContext = {
  validationErrors: string[];
  languageCodeWarnings: string[];
  sizeWarnings: string[];
};

type CliOptions = {
  watch: boolean;
  files: string[];
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isSupportedDocExtension(filePath: string): boolean {
  return filePath.endsWith('.md') || filePath.endsWith('.mdx');
}

function isPathInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function getRelativePathInsideSource(filePath: string): string | null {
  const resolvedPath = path.resolve(filePath);
  if (resolvedPath === SOURCE_ROOT) {
    return '';
  }
  if (!isPathInside(SOURCE_ROOT, resolvedPath)) {
    return null;
  }
  return path.relative(SOURCE_ROOT, resolvedPath).replace(/\\/g, '/');
}

function isGeneratedLanguagePath(filePath: string): boolean {
  const rel = getRelativePathInsideSource(filePath);
  if (rel === null) {
    return false;
  }
  const firstSegment = rel.split('/')[0];
  return GENERATED_LANGUAGE_DIRS.has(firstSegment);
}

function isSourceDocFile(filePath: string): boolean {
  if (!isSupportedDocExtension(filePath)) {
    return false;
  }
  const rel = getRelativePathInsideSource(filePath);
  if (rel === null || rel.length === 0) {
    return false;
  }
  const firstSegment = rel.split('/')[0];
  return !GENERATED_LANGUAGE_DIRS.has(firstSegment);
}

function isSourceDocCandidate(filePath: string): boolean {
  const rel = getRelativePathInsideSource(filePath);
  if (rel === null || rel.length === 0) {
    return false;
  }
  const firstSegment = rel.split('/')[0];
  if (GENERATED_LANGUAGE_DIRS.has(firstSegment)) {
    return false;
  }
  return isSupportedDocExtension(filePath);
}

async function walkSourceDocs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isGeneratedLanguagePath(fullPath)) {
        continue;
      }
      files.push(...(await walkSourceDocs(fullPath)));
    } else if (entry.isFile() && isSourceDocFile(fullPath)) {
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
  const normalized = declared
    .map((value) => value.toLowerCase())
    .filter((value): value is Language => LANGUAGES.includes(value as Language));
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

function renderLanguageSegment(
  source: string,
  nodes: LanguageBlockNode[],
  start: number,
  end: number,
  language: Language,
): string {
  let cursor = start;
  let output = '';

  for (const node of nodes) {
    if (node.openStart < start || node.closeEnd > end) {
      continue;
    }
    output += source.slice(cursor, node.openStart);
    if (node.langs.includes(language)) {
      output += renderLanguageSegment(source, node.children, node.openEnd, node.closeStart, language);
    }
    cursor = node.closeEnd;
  }

  output += source.slice(cursor, end);
  return output;
}

function renderBodyForLanguage(body: string, language: Language): string {
  let rendered = body;

  rendered = rendered.replace(/^import\s+Lang\s+from\s+['"][^'"]+['"];?\n/gm, '');
  rendered = rendered.replace(/^import\s+CopyMarkdownButton\s+from\s+['"][^'"]+['"];?\n/gm, '');

  rendered = rendered.replace(
    /<div[^>]*style="[^"]*display:\s*flex[^"]*justify-content:\s*space-between[^"]*">[\s\S]*?<\/div>\s*/g,
    '',
  );

  const blocks = parseLanguageBlocks(rendered);
  rendered = renderLanguageSegment(rendered, blocks, 0, rendered.length, language);
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

  rewritten = rewritten.replace(
    /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
    (_full, prefix, rel, suffix) => `${prefix}${rewriteRelativePath(rel)}${suffix}`,
  );

  rewritten = rewritten.replace(
    /(\]\()(\.\.?\/[^)\s]+)(\))/g,
    (_full, prefix, rel, suffix) => `${prefix}${rewriteRelativePath(rel)}${suffix}`,
  );

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

async function ensureOutputLanguageDirs(): Promise<void> {
  for (const language of LANGUAGES) {
    await mkdir(path.join(OUTPUT_ROOT, language), { recursive: true });
  }
}

async function removeGeneratedForSlug(slug: string): Promise<void> {
  for (const language of LANGUAGES) {
    await rm(path.join(OUTPUT_ROOT, language, `${slug}.md`), { force: true });
    await rm(path.join(OUTPUT_ROOT, language, `${slug}.mdx`), { force: true });
  }
}

async function generateForSourceFile(filePath: string, context: GenerateContext): Promise<void> {
  const source = await readFile(filePath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(source);
  const isLanguageAgnostic = Boolean(frontmatter.isLanguageAgnostic);
  const supportedLanguages = getSupportedLanguages(frontmatter);
  const blockValidation = validateLanguageBlocks(body, supportedLanguages, filePath);
  context.validationErrors.push(...blockValidation.errors);
  context.languageCodeWarnings.push(...blockValidation.warnings);

  const fileRelativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const renderedByLanguage = new Map<Language, string>();
  for (const language of supportedLanguages) {
    const rendered = renderBodyForLanguage(body, language);
    renderedByLanguage.set(language, rendered);
    const charCount = getMeaningfulContentCharCount(rendered);
    if (charCount === 0) {
      context.sizeWarnings.push(
        `${fileRelativePath} declares "${language}" in supportedLanguages but rendered content is empty.`,
      );
      continue;
    }
    if (charCount < MIN_LANGUAGE_CONTENT_CHARS_WARNING) {
      context.sizeWarnings.push(
        `${fileRelativePath} declares "${language}" in supportedLanguages but rendered content is very small (${charCount} non-whitespace chars).`,
      );
    }
  }

  const slug = slugFromSourcePath(filePath);
  await removeGeneratedForSlug(slug);

  if (isLanguageAgnostic) {
    return;
  }

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
      renderedByLanguage.get(language) || renderBodyForLanguage(body, language),
      filePath,
      outputPath,
    );
    const generatedNotice = buildGeneratedFileNotice(filePath, extension);
    const outputContent = `---\n${stringify(languageFrontmatter).trimEnd()}\n---\n\n${generatedNotice}\n\n${renderedBody}`;
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, outputContent);
  }
}

function printGenerateWarnings(context: GenerateContext): void {
  if (context.sizeWarnings.length > 0) {
    console.warn(
      [
        'generate-language-pages: Found pages with empty/very-small content for declared supportedLanguages:',
        ...context.sizeWarnings.map((warning) => `- ${warning}`),
      ].join('\n'),
    );
  }

  if (context.languageCodeWarnings.length > 0) {
    console.warn(
      [
        'generate-language-pages: Found possible code-fence language mismatches inside Lang blocks:',
        ...context.languageCodeWarnings.map((warning) => `- ${warning}`),
      ].join('\n'),
    );
  }
}

function createGenerateContext(): GenerateContext {
  return {
    validationErrors: [],
    languageCodeWarnings: [],
    sizeWarnings: [],
  };
}

function throwValidationErrors(context: GenerateContext): void {
  if (context.validationErrors.length === 0) {
    return;
  }
  console.error(
    [
      'generate-language-pages: Lang/supportedLanguages validation failed.',
      ...context.validationErrors.map((error) => `- ${error}`),
    ].join('\n'),
  );
  throw new Error(`Found ${context.validationErrors.length} Lang/supportedLanguages validation error(s).`);
}

async function generateAll(): Promise<void> {
  for (const language of LANGUAGES) {
    await rm(path.join(OUTPUT_ROOT, language), { recursive: true, force: true });
  }
  await ensureOutputLanguageDirs();

  const context = createGenerateContext();
  const sourceFiles = await walkSourceDocs(SOURCE_ROOT);
  for (const filePath of sourceFiles) {
    await generateForSourceFile(filePath, context);
  }

  throwValidationErrors(context);
  printGenerateWarnings(context);
  console.log(`Generated language-specific pages in ${OUTPUT_ROOT}/{js,go,dart,python}`);
}

async function generateSpecificFiles(files: string[], strictValidation: boolean): Promise<void> {
  await ensureOutputLanguageDirs();
  const context = createGenerateContext();

  for (const requestedPath of files) {
    const absolutePath = path.resolve(requestedPath);
    if (!isSourceDocCandidate(absolutePath)) {
      continue;
    }
    if (!(await fileExists(absolutePath))) {
      await removeGeneratedForSlug(slugFromSourcePath(absolutePath));
      continue;
    }
    if (!isSourceDocFile(absolutePath)) {
      continue;
    }
    await generateForSourceFile(absolutePath, context);
  }

  if (strictValidation) {
    throwValidationErrors(context);
  } else if (context.validationErrors.length > 0) {
    console.error(
      [
        'generate-language-pages: Validation failed for changed files (watch mode continues):',
        ...context.validationErrors.map((error) => `- ${error}`),
      ].join('\n'),
    );
  }

  printGenerateWarnings(context);
}

function parseCliOptions(argv: string[]): CliOptions {
  const files: string[] = [];
  let watchMode = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--watch') {
      watchMode = true;
      continue;
    }
    if (arg === '--file' && argv[i + 1]) {
      files.push(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith('--file=')) {
      files.push(arg.slice('--file='.length));
      continue;
    }
  }

  return { watch: watchMode, files };
}

async function runWatchMode(): Promise<void> {
  await generateAll();
  console.log(`Watching ${SOURCE_ROOT} for source doc changes...`);

  const pending = new Set<string>();
  let flushTimer: NodeJS.Timeout | null = null;
  let isProcessing = false;

  const flushChanges = async () => {
    if (isProcessing || pending.size === 0) {
      return;
    }
    isProcessing = true;
    const changed = Array.from(pending);
    pending.clear();
    try {
      await generateSpecificFiles(changed, false);
      if (changed.length > 0) {
        const relList = changed
          .map((filePath) => path.relative(process.cwd(), filePath).replace(/\\/g, '/'))
          .join(', ');
        console.log(`Regenerated changed docs: ${relList}`);
      }
    } catch (error) {
      console.error('generate-language-pages: Failed to process changed docs.');
      console.error(error);
    } finally {
      isProcessing = false;
      if (pending.size > 0) {
        queueFlush();
      }
    }
  };

  const queueFlush = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
    }
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushChanges();
    }, WATCH_DEBOUNCE_MS);
  };

  watch(
    SOURCE_ROOT,
    { recursive: true },
    (_eventType, filename) => {
      if (!filename) {
        return;
      }
      const changedPath = path.resolve(SOURCE_ROOT, filename.toString());
      if (!isSourceDocCandidate(changedPath)) {
        return;
      }
      pending.add(changedPath);
      queueFlush();
    },
  );

  await new Promise(() => {});
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));

  if (options.watch) {
    await runWatchMode();
    return;
  }

  if (options.files.length > 0) {
    await generateSpecificFiles(options.files, true);
    console.log('Generated language-specific pages for requested files.');
    return;
  }

  await generateAll();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

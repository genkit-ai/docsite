import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, stringify } from 'yaml';

const SOURCE_ROOT = path.resolve('src/content/docs/docs');
const OUTPUT_ROOT = path.resolve('src/content/docs/docs');
const LANGUAGES = ['js', 'go', 'dart', 'python'] as const;
const FALLBACK_LANGUAGES = ['js', 'go', 'dart', 'python'] as const;

type Language = (typeof LANGUAGES)[number];
type LanguageBlockNode = {
  langs: string[];
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
      output += renderLanguageSegment(
        source,
        node.children,
        node.openEnd,
        node.closeStart,
        language,
      );
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

  rendered = rendered.replace(/\n{3,}/g, '\n\n').trim();
  return `${rendered}\n`;
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
  for (const language of LANGUAGES) {
    await rm(path.join(OUTPUT_ROOT, language), { recursive: true, force: true });
    await mkdir(path.join(OUTPUT_ROOT, language), { recursive: true });
  }

  const sourceFiles = await walk(SOURCE_ROOT);
  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, 'utf8');
    const { frontmatter, body } = splitFrontmatter(source);
    const isLanguageAgnostic = Boolean(frontmatter.isLanguageAgnostic);
    if (isLanguageAgnostic) {
      continue;
    }
    const supportedLanguages = getSupportedLanguages(frontmatter);
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
        renderBodyForLanguage(body, language),
        filePath,
        outputPath,
      );
      const generatedNotice = buildGeneratedFileNotice(filePath, extension);
      const outputContent = `---\n${stringify(languageFrontmatter).trimEnd()}\n---\n\n${generatedNotice}\n\n${renderedBody}`;
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, outputContent);
    }
  }

  console.log(`Generated language-specific pages in ${OUTPUT_ROOT}/{js,go,dart,python}`);
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'node:fs/promises';
import path from 'path';
import { parse } from 'yaml';
import { rewriteInternalDocsLinks } from './docs-link-routing.js';

export interface ProcessedDocument {
  slug: string;
  title: string;
  supportedLanguages: string[];
  isLanguageAgnostic?: boolean;
  content: {
    js: string;
    go: string;
    python: string;
    dart: string;
  };
  filePath: string;
}

type LanguageBlockNode = {
  langs: string[];
  openStart: number;
  openEnd: number;
  closeStart: number;
  closeEnd: number;
  children: LanguageBlockNode[];
};

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
      const langMatch = attrs.match(
        /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|\{([^}]+)\})/i,
      );
      if (!langMatch) {
        continue;
      }
      const rawLangs = langMatch[1] || langMatch[2] || langMatch[3] || '';
      const langs = rawLangs
        .replace(/[\[\]'"\s]+/g, ' ')
        .split(/[\s,]+/)
        .map((value) => normalizeLanguage(value.trim()))
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
  language: string,
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

// Language filtering utility function
export function filterContentByLanguage(
  content: string,
  targetLang: string = 'js',
): string {
  // Normalize language parameter
  const normalizedLang = normalizeLanguage(targetLang);

  // Remove the language controls div (contains copy controls)
  content = content.replace(
    /<div[^>]*language-controls[^>]*>[\s\S]*?<\/div>/g,
    '',
  );
  content = content.replace(
    /<div[^>]*style="[^"]*display:\s*flex[^"]*justify-content:\s*space-between[^"]*">[\s\S]*?<\/div>/g,
    '',
  );

  // Remove CopyMarkdownButton components
  content = content.replace(/<CopyMarkdownButton[^>]*\/>/g, '');
  content = content.replace(
    /<CopyMarkdownButton[^>]*>[\s\S]*?<\/CopyMarkdownButton>/g,
    '',
  );

  // Process language blocks (supports nested <Lang> tags).
  const blocks = parseLanguageBlocks(content);
  let filteredContent = renderLanguageSegment(
    content,
    blocks,
    0,
    content.length,
    normalizedLang,
  );

  // Strip any leading ESM imports/exports that were nested inside the opening <Lang> block.
  const h1Match = filteredContent.match(/^(# [^\n]+\n+)/);
  if (h1Match) {
    const heading = h1Match[1];
    const body = stripLeadingEsm(filteredContent.slice(heading.length));
    filteredContent = `${heading}${body}`;
  } else {
    filteredContent = stripLeadingEsm(filteredContent);
  }

  // Clean up extra whitespace
  filteredContent = filteredContent.replace(/\n{3,}/g, '\n\n');
  filteredContent = rewriteInternalDocsLinks(
    filteredContent,
    normalizedLang as 'js' | 'go' | 'dart' | 'python',
    undefined,
    {
      context: 'content-processor',
      warnOnUnresolved: true,
    },
  );

  return filteredContent.trim();
}

export function normalizeLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    js: 'js',
    javascript: 'js',
    go: 'go',
    golang: 'go',
    python: 'python',
    py: 'python',
    dart: 'dart',
  };
  return langMap[lang.toLowerCase()] || 'js';
}

export async function processRawContent(
  rawContent: string,
  title: string,
  sourceFilePath?: string,
): Promise<string> {
  // Apply standard processing
  // 1. Remove frontmatter block
  let processedContent = rawContent.replace(/^---\s*[\s\S]*?---/, '').trim();

  // Remove generated-file notices from markdown exports while keeping them in source files.
  processedContent = processedContent.replace(
    /^\s*\{\/\*\s*AUTO-GENERATED FILE[\s\S]*?\*\/\}\s*/i,
    '',
  );
  processedContent = processedContent.replace(
    /^\s*<!--\s*AUTO-GENERATED FILE[\s\S]*?-->\s*/i,
    '',
  );

  // 2. Resolve <Code code={...} /> references and inline exported JSX constants BEFORE stripping imports
  //    (the resolver needs to see the import/export statements).
  if (sourceFilePath) {
    processedContent = await resolveCodeReferences(
      processedContent,
      sourceFilePath,
    );
  }
  processedContent = inlineExportedJsxConstants(processedContent);

  // 3. Remove leading ESM declarations (imports + top-level export const expressions).
  //    Handles both single-line and multi-line forms by tracking bracket depth.
  processedContent = stripLeadingEsm(processedContent);

  // 4. Remove LLMSummary blocks (like other Astro-specific syntax)
  processedContent = processedContent.replace(
    /<LLMSummary>([\s\S]*?)<\/LLMSummary>/g,
    '',
  );

  // 5. Clean up extra whitespace
  processedContent = processedContent.replace(/\n{3,}/g, '\n\n').trim();

  // 6. Prepend H1 title
  return `# ${title}\n\n${processedContent}`;
}

function inlineExportedJsxConstants(content: string): string {
  const constRegex =
    /^export\s+const\s+(\w+)\s*=\s*\(\s*\n([\s\S]*?)\n\);\s*$/gm;
  const constants = new Map<string, string>();
  for (const match of content.matchAll(constRegex)) {
    constants.set(match[1], match[2].trim());
  }
  if (constants.size === 0) {
    return content;
  }
  const fenceRegex = /(^[ \t]*```[^\n]*\n[\s\S]*?^[ \t]*```[ \t]*$)/gm;
  return content
    .split(fenceRegex)
    .map((chunk, index) => {
      if (index % 2 === 1) {
        return chunk;
      }
      let replaced = chunk;
      for (const [name, jsx] of constants) {
        replaced = replaced.replace(
          new RegExp(`\\{\\s*${name}\\s*\\}`, 'g'),
          () => jsx,
        );
      }
      return replaced;
    })
    .join('');
}

function stripLeadingEsm(content: string): string {
  const lines = content.split('\n');
  let i = 0;
  let depth = 0;
  let inEsm = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inEsm) {
      if (trimmed === '') {
        i++;
        continue;
      }
      if (
        !/^(?:import\s+(?:[\w*{]|['"])|export\s+(?:(?:const|let|var|function|default|class|type|interface)\b|[\{*]))/.test(
          trimmed,
        )
      )
        break;
      inEsm = true;
      depth = 0;
    }

    for (const ch of line) {
      if (ch === '(' || ch === '{' || ch === '[') depth++;
      else if (ch === ')' || ch === '}' || ch === ']') depth--;
    }
    i++;

    // Statement ends when depth is balanced AND the line terminates with ;, a from-clause,
    // or a complete expression token (optionally followed by a trailing // or /* */ comment).
    if (
      depth <= 0 &&
      /(?:;|from\s+['"][^'"]+['"]\??(?:raw)?['"]?\s*;?|[\w'"`}\])])\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)?\s*$/.test(
        line,
      )
    ) {
      inEsm = false;
      depth = 0;
    }
  }
  return lines.slice(i).join('\n').trim();
}

interface SnippetImports {
  raw: Record<string, string>; // identifier -> path (no ?raw suffix)
  named: Record<string, string>; // identifier -> path
}

function collectSnippetImports(content: string): SnippetImports {
  const raw: Record<string, string> = {};
  const named: Record<string, string> = {};

  // import X from './path?raw';
  const rawRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+?)\?raw['"];?/g;
  for (const m of content.matchAll(rawRegex)) {
    raw[m[1]] = m[2];
  }

  // import { A, B as C } from './path';  (local-relative only)
  const namedRegex =
    /import\s+\{\s*([^}]+?)\s*\}\s+from\s+['"](\.[^'"]+?)['"];?/g;
  for (const m of content.matchAll(namedRegex)) {
    const importPath = m[2];
    if (importPath.includes('?raw')) continue;
    for (const entry of m[1].split(',')) {
      const name = entry
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) named[name] = importPath;
    }
  }
  return { raw, named };
}

function resolveImportPath(sourceFilePath: string, importPath: string): string {
  return path.resolve(
    path.dirname(sourceFilePath),
    importPath.replace(/\?raw$/, ''),
  );
}

async function readSnippetFile(basePath: string): Promise<string | null> {
  for (const candidate of [basePath, `${basePath}.ts`, `${basePath}.tsx`]) {
    try {
      return await fs.readFile(candidate, 'utf-8');
    } catch {
      // try next
    }
  }
  return null;
}

async function resolveCodeExpression(
  expr: string,
  imports: SnippetImports,
  sourceFilePath: string,
): Promise<string | null> {
  expr = expr.trim();

  // Case 0: string/template literal inside braces, e.g. code={"..."} or code={`...`}
  const strLiteralMatch = expr.match(
    /^(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)$/,
  );
  if (strLiteralMatch) {
    return strLiteralMatch[1] ?? strLiteralMatch[2] ?? strLiteralMatch[3];
  }

  // Case 1: bare identifier — must be a `?raw` import.
  const idMatch = expr.match(/^(\w+)$/);
  if (idMatch) {
    const importPath = imports.raw[idMatch[1]];
    if (!importPath) return null;
    return await readSnippetFile(resolveImportPath(sourceFilePath, importPath));
  }

  // Case 2: function call: fn('arg') — call a named export with a string literal.
  const fnMatch = expr.match(/^(\w+)\(\s*(['"])([^'"]*)\2\s*\)$/);
  if (fnMatch) {
    const [, fnName, , arg] = fnMatch;
    const importPath = imports.named[fnName];
    if (!importPath) return null;
    const fileContent = await readSnippetFile(
      resolveImportPath(sourceFilePath, importPath),
    );
    if (!fileContent) return null;

    // Find: export const fnName = (paramName: type, ...) => `template body`;
    const fnRegex = new RegExp(
      `export\\s+const\\s+${fnName}\\s*=\\s*\\(\\s*(\\w+)[^)]*\\)\\s*=>\\s*\`([\\s\\S]*?)\`;`,
    );
    const m = fileContent.match(fnRegex);
    if (!m) return null;
    const [, paramName, rawBody] = m;
    // Substitute ${paramName} → arg; preserve the template literal's escapes
    // (since the snippet file is real TS, ${...} interpolations are unescaped).
    const escapedParam = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return rawBody.replace(
      new RegExp('\\$\\{\\s*' + escapedParam + '\\s*\\}', 'g'),
      arg,
    );
  }

  return null;
}

async function resolveCodeReferences(
  content: string,
  sourceFilePath: string,
): Promise<string> {
  if (!/<Code\b/.test(content)) {
    return content;
  }

  const imports = collectSnippetImports(content);

  // Match <Code ... /> tags (single or multi-line). The closing /> is unambiguous since
  // attribute values like `meta='title="path/to/file"'` don't contain />.
  const codeTagRegex = /<Code\b([\s\S]*?)\/>/g;
  const replacements: { match: string; replacement: string }[] = [];

  for (const match of content.matchAll(codeTagRegex)) {
    const [full, attrs] = match;
    const codeExpr = extractBraceAttr(attrs, 'code');
    const codeLiteral = extractStringAttr(attrs, 'code');
    const lang = extractStringAttr(attrs, 'lang');
    const meta = extractStringAttr(attrs, 'meta');
    if ((!codeExpr && codeLiteral === null) || !lang) continue;

    const resolved = codeExpr
      ? await resolveCodeExpression(codeExpr, imports, sourceFilePath)
      : codeLiteral;
    if (resolved == null) continue;

    const trimmed = resolved.replace(/\n+$/, '');
    const fence =
      '```' + lang + (meta ? ' ' + meta : '') + '\n' + trimmed + '\n```';
    replacements.push({ match: full, replacement: fence });
  }

  let result = content;
  for (const { match, replacement } of replacements) {
    result = result.replace(match, () => replacement);
  }
  return result;
}

function extractStringAttr(attrs: string, name: string): string | null {
  // name="value with possible 'inner' quotes" or name='value with possible "inner" quotes'
  const regex = new RegExp(`\\b${name}\\s*=\\s*(['"])((?:(?!\\1).)*)\\1`);
  const m = attrs.match(regex);
  return m ? m[2] : null;
}

function extractBraceAttr(attrs: string, name: string): string | null {
  const regex = new RegExp(`\\b${name}\\s*=\\s*\\{([^}]*)\\}`);
  const m = attrs.match(regex);
  return m ? m[1].trim() : null;
}

export async function processDocumentEntry(
  entry: any,
): Promise<ProcessedDocument | null> {
  const filePath = entry.filePath;
  const slug = entry.id.replace(/\.(md|mdx)$/, '');
  const title = entry.data.title;

  if (!filePath || !title) {
    console.warn(`Skipping entry with missing filePath or title: ${entry.id}`);
    return null;
  }

  try {
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const baseContent = await processRawContent(rawContent, title, filePath);

    // Generate language-specific versions
    const content = {
      js: filterContentByLanguage(baseContent, 'js'),
      go: filterContentByLanguage(baseContent, 'go'),
      python: filterContentByLanguage(baseContent, 'python'),
      dart: filterContentByLanguage(baseContent, 'dart'),
    };

    return {
      slug,
      title,
      supportedLanguages: entry.data.supportedLanguages || [
        'js',
        'go',
        'dart',
        'python',
      ],
      isLanguageAgnostic: entry.data.isLanguageAgnostic,
      content,
      filePath,
    };
  } catch (error) {
    console.error(`Error processing ${slug}:`, error);
    return null;
  }
}

function extractFrontmatter(content: string): {
  frontmatter: any;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (match) {
    try {
      const frontmatter = parse(match[1]);
      return { frontmatter, body: match[2] };
    } catch (error) {
      console.warn('Failed to parse frontmatter:', error);
      return { frontmatter: {}, body: content };
    }
  }

  return { frontmatter: {}, body: content };
}

const GENERATED_LANG_DIRS = new Set(['js', 'go', 'dart', 'python']);

async function findAllMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name === 'README.md') {
        continue;
      }
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (
          path.basename(dir) === 'docs' &&
          GENERATED_LANG_DIRS.has(entry.name)
        ) {
          continue;
        }
        const subFiles = await findAllMdxFiles(fullPath);
        files.push(...subFiles);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))
      ) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Failed to read directory ${dir}:`, error);
  }

  return files;
}

export async function getAllProcessedDocuments(): Promise<ProcessedDocument[]> {
  const contentDir = 'src/content/docs';
  const processedDocs: ProcessedDocument[] = [];

  // Find all MDX files
  const allFiles = await findAllMdxFiles(contentDir);

  for (const filePath of allFiles) {
    try {
      const rawContent = await fs.readFile(filePath, 'utf-8');
      const { frontmatter } = extractFrontmatter(rawContent);

      if (!frontmatter.title) {
        console.warn(`Skipping file without title: ${filePath}`);
        continue;
      }

      // Generate slug from file path
      const relativePath = path.relative(contentDir, filePath);
      const slug = relativePath.replace(/\.(md|mdx)$/, '');

      const baseContent = await processRawContent(
        rawContent,
        frontmatter.title,
        filePath,
      );

      // Generate language-specific versions
      const content = {
        js: filterContentByLanguage(baseContent, 'js'),
        go: filterContentByLanguage(baseContent, 'go'),
        python: filterContentByLanguage(baseContent, 'python'),
        dart: filterContentByLanguage(baseContent, 'dart'),
      };

      processedDocs.push({
        slug,
        title: frontmatter.title,
        supportedLanguages: frontmatter.supportedLanguages || [
          'js',
          'go',
          'dart',
          'python',
        ],
        isLanguageAgnostic: frontmatter.isLanguageAgnostic,
        content,
        filePath,
      });
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  console.log(`Found ${processedDocs.length} documents`);
  return processedDocs;
}

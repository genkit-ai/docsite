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

import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { parse } from 'yaml';
import {
  filterContentByLanguage,
  processRawContent,
} from './utils/content-processor.js';

const LANGUAGES = ['js', 'go', 'dart', 'python'] as const;
const GENERATED_LANG_DIRS = new Set<string>(LANGUAGES);
const MAX_LANG_INDEX_BYTES = 60 * 1024; // 60 KB cap for MCP list_genkit_docs index per language

export const FRONTMATTER_AND_BODY_REGEX =
  /^---\s*(?:\r\n|\r|\n)([\s\S]*?)(?:\r\n|\r|\n)---\s*(?:\r\n|\r|\n)([\s\S]*)$/;

interface Doc {
  title: string;
  description?: string;
  text: string;
  url: string;
  headers: string;
  lang: string;
}

function resolveDescription(
  description: unknown,
  lang: string,
): string | undefined {
  if (typeof description === 'string') {
    return description;
  }
  if (
    description &&
    typeof description === 'object' &&
    !Array.isArray(description)
  ) {
    const record = description as Record<string, unknown>;
    if (typeof record[lang] === 'string') {
      return record[lang] as string;
    }
    if (typeof record.default === 'string') {
      return record.default;
    }
  }
  return undefined;
}

function stripCodeFences(markdown: string): string {
  return markdown.replace(
    /^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm,
    '',
  );
}

function stripCodeFencesAndInlineCode(markdown: string): string {
  return stripCodeFences(markdown).replace(/`[^`\n]+`/g, '');
}

function extractHeadersOutsideCodeFences(markdown: string): string {
  const matches = stripCodeFences(markdown).match(/^#{1,6}\s+.*/gm);
  return matches ? `${matches.join('\n')}\n` : '';
}

function isSourceDocFile(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (GENERATED_LANG_DIRS.has(segments[0])) {
    return false;
  }
  if (segments.some((s) => s.startsWith('_') || s === 'README.md')) {
    return false;
  }
  return normalized.endsWith('.md') || normalized.endsWith('.mdx');
}

function validateBundle(documents: Record<string, Doc>): void {
  const errors: string[] = [];

  for (const [key, doc] of Object.entries(documents)) {
    if (/^(js|go|dart|python)\/(js|go|dart|python)\//.test(key)) {
      errors.push(`${key}: duplicate language prefix in document key`);
    }
    if (typeof doc.title !== 'string' || !doc.title.trim()) {
      errors.push(`${key}: title must be a non-empty string`);
    }
    if (doc.description !== undefined && typeof doc.description !== 'string') {
      errors.push(
        `${key}: description must be a string or undefined (got ${typeof doc.description})`,
      );
    }
    if (typeof doc.text !== 'string' || !doc.text.trim()) {
      errors.push(`${key}: text must be a non-empty string`);
    }
    if (typeof doc.url !== 'string' || !doc.url.trim()) {
      errors.push(`${key}: url must be a non-empty string`);
    }
    if (typeof doc.headers !== 'string') {
      errors.push(`${key}: headers must be a string`);
    }
    if (!LANGUAGES.includes(doc.lang as (typeof LANGUAGES)[number])) {
      errors.push(`${key}: invalid lang "${doc.lang}"`);
    }

    const prose = stripCodeFencesAndInlineCode(doc.text);
    if (/<(Lang|Code|CopyMarkdownButton)\b/.test(prose)) {
      errors.push(
        `${key}: text contains unexpanded MDX component (<Lang>, <Code>, or <CopyMarkdownButton>)`,
      );
    }
    if (/^\{\s*[A-Za-z_$][\w$]*\s*\}$/m.test(prose)) {
      errors.push(
        `${key}: text contains unexpanded JSX expression placeholder`,
      );
    }
    const bodyAfterTitle = prose.replace(/^#[^\n]*\n+/, '');
    if (
      /^\s*(?:import\s+(?:[\w*{]|['"])|export\s+(?:(?:const|let|var|function|default|class|type|interface)\b|[\{*]))/.test(
        bodyAfterTitle,
      )
    ) {
      errors.push(
        `${key}: text contains unstripped leading ESM import/export statement`,
      );
    }
  }

  for (const lang of LANGUAGES) {
    const indexPayload = Object.keys(documents)
      .filter((k) => k.startsWith(`${lang}/`))
      .sort()
      .map((k) => {
        const d = documents[k];
        let summary = ` - FilePath: ${k}\n   Title: ${d.title}\n`;
        if (d.description) {
          summary += `   Description: ${d.description}\n`;
        }
        if (d.headers) {
          summary += `   Headers:\n     ${d.headers.split('\n').join('\n     ')}\n`;
        }
        return summary;
      })
      .join('\n');
    const byteLength = Buffer.byteLength(indexPayload, 'utf8');
    if (byteLength > MAX_LANG_INDEX_BYTES) {
      errors.push(
        `Index payload for "${lang}" is ${(byteLength / 1024).toFixed(1)} KB, exceeding ${MAX_LANG_INDEX_BYTES / 1024} KB limit`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `docs-bundle validation failed with ${errors.length} error(s):\n- ${errors.join('\n- ')}`,
    );
  }
}

async function indexDocs(dir: string): Promise<Record<string, Doc>> {
  const allFiles = await readdir(dir, { recursive: true });
  const docFiles = allFiles.filter(isSourceDocFile);
  const byLang: Record<string, Record<string, Doc>> = {
    js: {},
    go: {},
    dart: {},
    python: {},
  };

  for (const file of docFiles) {
    const fullPath = path.resolve(dir, file);
    const markdown = await readFile(fullPath, { encoding: 'utf8' });
    const { frontmatter } = extractFrontmatterAndBody(markdown);
    const rawSupported = Array.isArray(frontmatter.supportedLanguages)
      ? frontmatter.supportedLanguages
      : [...LANGUAGES];
    const supportedLanguages = LANGUAGES.filter((lang) =>
      rawSupported.includes(lang),
    );
    if (supportedLanguages.length === 0) {
      continue;
    }

    const normalizedFileName = file
      .replace(/\\/g, '/')
      .replace(/\.mdx$/, '.md');
    const slugPath = normalizedFileName.slice(
      0,
      normalizedFileName.lastIndexOf('.'),
    );
    const isLanguageAgnostic = Boolean(frontmatter.isLanguageAgnostic);
    const title = frontmatter.title || normalizedFileName;

    const baseContent = await processRawContent(markdown, title, fullPath);

    for (const lang of supportedLanguages) {
      const text = filterContentByLanguage(baseContent, lang);
      const headers = extractHeadersOutsideCodeFences(text);

      byLang[lang][`${lang}/${normalizedFileName}`] = {
        text,
        url: isLanguageAgnostic
          ? `https://genkit.dev/docs/${slugPath}/`
          : `https://genkit.dev/docs/${lang}/${slugPath}/`,
        title,
        description: resolveDescription(frontmatter.description, lang),
        headers,
        lang,
      };
    }
  }

  const documents: Record<string, Doc> = {};
  for (const lang of LANGUAGES) {
    Object.assign(documents, byLang[lang]);
  }
  return documents;
}

export function extractFrontmatterAndBody(source: string) {
  const match = source.match(FRONTMATTER_AND_BODY_REGEX);
  if (match) {
    const [, frontmatter, body] = match;
    return { frontmatter: parse(frontmatter), body };
  }
  return { frontmatter: {}, body: '' };
}

async function main() {
  const documents = await indexDocs('src/content/docs/docs');
  validateBundle(documents);
  await writeFile(
    `public/docs-bundle-experimental.json`,
    JSON.stringify(documents, undefined, 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

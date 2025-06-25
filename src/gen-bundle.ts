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

export const FRONTMATTER_AND_BODY_REGEX = /^---\s*(?:\r\n|\r|\n)([\s\S]*?)(?:\r\n|\r|\n)---\s*(?:\r\n|\r|\n)([\s\S]*)$/;

async function main() {
  const js = await indexLang('js', 'src/content/docs/docs');
  const go = await indexLang('go', 'src/content/docs/go/docs');
  const python = await indexLang('python', 'src/content/docs/python/docs');

  await writeFile(`public/docs-bundle.json`, JSON.stringify({ ...js, ...go, ...python }, undefined, 2));
}

interface Doc {
  title: string;
  text: string;
  lang: string;
}

async function indexLang(lang: string, dir: string) {
  const allFiles = await readdir(dir, { recursive: true });
  const docFiles = allFiles.filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  const documents: Record<string, Doc> = {};
  for (const file of docFiles) {
    const markdown = await readFile(path.resolve(dir, file), { encoding: 'utf8' });
    const { frontmatter, body } = await extractFrontmatterAndBody(markdown);
    documents[`${lang}/${file}`] = {
      text: body,
      title: frontmatter.title || file,
      lang,
    };
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

main();

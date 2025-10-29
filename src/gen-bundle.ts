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
	const allDocs = await indexDocs('src/content/docs/docs');
	const documents: Record<string, Doc> = {};
	for (const lang of ['js', 'go', 'python']) {
		for (const doc of Object.keys(allDocs)) {
			documents[`${lang}/${doc}`] = {
				...allDocs[doc],
				lang,
			};
		}
	}
	await writeFile(`public/docs-bundle-experimental.json`, JSON.stringify(documents, undefined, 2));
}

interface Doc {
	title: string;
	description?: string;
	text: string;
	url: string;
	headers: string;
	lang: string;
}

async function indexDocs(dir: string) {
	const allFiles = await readdir(dir, { recursive: true });
	const docFiles = allFiles.filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
	const documents: Record<string, Omit<Doc, 'lang'>> = {};

	for (const file of docFiles) {
		const markdown = await readFile(path.resolve(dir, file), { encoding: 'utf8' });
		const { frontmatter, body } = await extractFrontmatterAndBody(markdown);
		const headers = body.match(/^#.*\n/gm)?.join('') ?? '';
		const normalizedFileName = file.endsWith('.mdx') ? file.substring(0, file.length - 1) : file;

		documents[normalizedFileName] = {
			text: renderContent(file, body, frontmatter.title || normalizedFileName),
			url:
				'https://genkit.dev/docs/' + normalizedFileName.substring(0, normalizedFileName.lastIndexOf('.')) + '/',
			title: frontmatter.title || normalizedFileName,
			description: frontmatter.description,
			headers,
		};
	}
	return documents;
}

const LLM_SUMMARY_REGEX = /<LLMSummary>([\s\S]*?)<\/LLMSummary>/;
const FRONTMATTER_REGEX = /^---\s*[\s\S]*?---/;

function renderContent(file: string, rawContent: string, title: string) {
	if (file.endsWith('.mdx')) {
		// --- Check for <LLMs> tag ---
		const llmMatch = rawContent.match(LLM_SUMMARY_REGEX);

		if (llmMatch && llmMatch[1]) {
			// Apply standard frontmatter/import removal to the *entire* raw content
			let fullProcessedContent = rawContent.replace(LLM_SUMMARY_REGEX, '').replace(FRONTMATTER_REGEX, '').trim();
			const fullLines = fullProcessedContent.split('\n');
			let fullFirstNonImportIndex = 0;
			for (let i = 0; i < fullLines.length; i++) {
				const trimmedLine = fullLines[i].trim();
				if (trimmedLine.startsWith('import ')) {
					fullFirstNonImportIndex = i + 1;
				} else if (trimmedLine === '') {
					fullFirstNonImportIndex = i + 1;
				} else {
					break;
				}
			}
			fullProcessedContent = fullLines.slice(fullFirstNonImportIndex).join('\n').trim();
			fullProcessedContent = `# ${title}\n\n${fullProcessedContent}`; // Prepend title
			return fullProcessedContent;
		} else {
			// --- Case 2: <LLMs> tag NOT found ---
			// Apply standard processing:

			// 2a. Remove frontmatter block
			let standardProcessedContent = rawContent.replace(FRONTMATTER_REGEX, '').trim();

			// 2b. Remove ONLY leading import statements
			const lines = standardProcessedContent.split('\n');
			let firstNonImportIndex = 0;
			for (let i = 0; i < lines.length; i++) {
				const trimmedLine = lines[i].trim();
				if (trimmedLine.startsWith('import ')) {
					// Still in the import block, mark next line as potential start of content
					firstNonImportIndex = i + 1;
				} else if (trimmedLine === '') {
					// Empty line, potentially between imports, mark next line as potential start
					firstNonImportIndex = i + 1;
				} else {
					// Found the first non-empty, non-import line, stop searching
					break;
				}
			}
			// Keep lines from the first non-import line onwards
			standardProcessedContent = lines.slice(firstNonImportIndex).join('\n').trim();

			// 2c. Prepend H1 title
			standardProcessedContent = `# ${title}\n\n${standardProcessedContent}`;
			return standardProcessedContent;
		}
	}
	rawContent = `# ${title}\n\n${rawContent}`; // Prepend title
	return rawContent;
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

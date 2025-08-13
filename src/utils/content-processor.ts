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

export interface ProcessedDocument {
  slug: string;
  title: string;
  content: {
    js: string;
    go: string;
    python: string;
  };
  filePath: string;
}

// Language filtering utility function
export function filterContentByLanguage(content: string, targetLang: string = 'js'): string {
  // Normalize language parameter
  const normalizedLang = normalizeLanguage(targetLang);
  
  // Remove the language controls div (contains LanguageSelector and CopyMarkdownButton)
  content = content.replace(/<div[^>]*language-controls[^>]*>[\s\S]*?<\/div>/g, '');
  content = content.replace(/<div[^>]*style="[^"]*display:\s*flex[^"]*justify-content:\s*space-between[^"]*">[\s\S]*?<\/div>/g, '');
  
  // Remove LanguageSelector components
  content = content.replace(/<LanguageSelector[^>]*\/>/g, '');
  content = content.replace(/<LanguageSelector[^>]*>[\s\S]*?<\/LanguageSelector>/g, '');
  
  // Remove CopyMarkdownButton components
  content = content.replace(/<CopyMarkdownButton[^>]*\/>/g, '');
  content = content.replace(/<CopyMarkdownButton[^>]*>[\s\S]*?<\/CopyMarkdownButton>/g, '');
  
  // Process LanguageContent blocks
  // First, find all LanguageContent blocks
  const languageContentRegex = /<LanguageContent\s+lang=["']([^"']+)["'][^>]*>([\s\S]*?)<\/LanguageContent>/g;
  
  let filteredContent = content;
  let match;
  const replacements: { original: string; replacement: string }[] = [];
  
  // Reset regex lastIndex to ensure we find all matches
  languageContentRegex.lastIndex = 0;
  
  // Collect all LanguageContent blocks
  while ((match = languageContentRegex.exec(content)) !== null) {
    const [fullMatch, lang, innerContent] = match;
    const normalizedBlockLang = normalizeLanguage(lang);
    
    if (normalizedBlockLang === normalizedLang) {
      // Keep content for matching language, but remove the wrapper
      replacements.push({
        original: fullMatch,
        replacement: innerContent.trim()
      });
    } else {
      // Remove content for non-matching languages
      replacements.push({
        original: fullMatch,
        replacement: ''
      });
    }
  }
  
  // Apply replacements
  for (const { original, replacement } of replacements) {
    filteredContent = filteredContent.replace(original, replacement);
  }
  
  // Clean up extra whitespace
  filteredContent = filteredContent.replace(/\n{3,}/g, '\n\n');
  
  return filteredContent.trim();
}

export function normalizeLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    'js': 'js',
    'javascript': 'js',
    'go': 'go',
    'golang': 'go',
    'python': 'python',
    'py': 'python'
  };
  return langMap[lang.toLowerCase()] || 'js';
}

export function processRawContent(rawContent: string, title: string): string {
  // Apply standard processing
  // 1. Remove frontmatter block
  let processedContent = rawContent.replace(/^---\s*[\s\S]*?---/, '').trim();
  
  // 2. Remove ONLY leading import statements
  const lines = processedContent.split('\n');
  let firstNonImportIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (trimmedLine.startsWith('import ')) {
      firstNonImportIndex = i + 1;
    } else if (trimmedLine === '') {
      firstNonImportIndex = i + 1;
    } else {
      break;
    }
  }
  processedContent = lines.slice(firstNonImportIndex).join('\n').trim();
  
  // 3. Remove LLMSummary blocks (like other Astro-specific syntax)
  processedContent = processedContent.replace(/<LLMSummary>([\s\S]*?)<\/LLMSummary>/g, '');
  
  // 4. Clean up extra whitespace
  processedContent = processedContent.replace(/\n{3,}/g, '\n\n').trim();
  
  // 5. Prepend H1 title
  return `# ${title}\n\n${processedContent}`;
}

export async function processDocumentEntry(entry: any): Promise<ProcessedDocument | null> {
  const filePath = entry.filePath;
  const slug = entry.id.replace(/\.(md|mdx)$/, '');
  const title = entry.data.title;
  
  if (!filePath || !title) {
    console.warn(`Skipping entry with missing filePath or title: ${entry.id}`);
    return null;
  }
  
  try {
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const baseContent = processRawContent(rawContent, title);
    
    // Generate language-specific versions
    const content = {
      js: filterContentByLanguage(baseContent, 'js'),
      go: filterContentByLanguage(baseContent, 'go'),
      python: filterContentByLanguage(baseContent, 'python'),
    };
    
    return {
      slug,
      title,
      content,
      filePath
    };
  } catch (error) {
    console.error(`Error processing ${slug}:`, error);
    return null;
  }
}

function extractFrontmatter(content: string): { frontmatter: any; body: string } {
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

async function findAllMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findAllMdxFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
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
      
      const baseContent = processRawContent(rawContent, frontmatter.title);
      
      // Generate language-specific versions
      const content = {
        js: filterContentByLanguage(baseContent, 'js'),
        go: filterContentByLanguage(baseContent, 'go'),
        python: filterContentByLanguage(baseContent, 'python'),
      };
      
      processedDocs.push({
        slug,
        title: frontmatter.title,
        content,
        filePath
      });
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log(`Found ${processedDocs.length} documents`);
  return processedDocs;
}

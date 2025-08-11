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
const LANGUAGE_CONTENT_REGEX = /<LanguageContent\s+lang="([^"]+)"[^>]*>([\s\S]*?)<\/LanguageContent>/g;
const IMPORT_REGEX = /^import\s+.*$/gm;
const COMPONENT_REGEX = /<[A-Z][a-zA-Z]*\s*(?:[^>]*)?\/?>(?:[\s\S]*?<\/[A-Z][a-zA-Z]*>)?/g;
const ASTRO_DIRECTIVE_REGEX = /:::[\s\S]*?:::/g;
const LINK_BUTTON_REGEX = /<LinkButton[\s\S]*?<\/LinkButton>/g;

interface ProcessedDoc {
  title: string;
  description?: string;
  content: {
    js: string;
    go: string;
    python: string;
    common: string; // Content outside of LanguageContent blocks
  };
  path: string;
}

interface LanguageSet {
  label: string;
  description: string;
  paths: string[];
}

const LANGUAGE_SETS: LanguageSet[] = [
  {
    label: "Building AI Workflows",
    description: "Guidance on how to generate content and interact with LLM and image models using Genkit.",
    paths: [
      "unified-docs/get-started",
      "unified-docs/generating-content",
      "unified-docs/context",
      "unified-docs/creating-flows",
      "unified-docs/dotprompt",
      "unified-docs/chat-sessions",
      "unified-docs/tool-calling",
      "unified-docs/model-context-protocol",
      "unified-docs/interrupts",
      "unified-docs/rag",
      "unified-docs/multi-agent-systems",
      "unified-docs/error-handling",
      "unified-docs/evaluation",
    ],
  },
  {
    label: "Deploying AI Workflows",
    description: "Guidance on how to deploy Genkit code to various environments including Firebase and Cloud Run or use within a Next.js app.",
    paths: [
      "unified-docs/deployment",
      "unified-docs/deployment/firebase",
      "unified-docs/deployment/cloud-run",
      "unified-docs/deployment/any-platform",
      "unified-docs/deployment/authorization",
      "unified-docs/frameworks/express",
      "unified-docs/frameworks/nextjs",
    ],
  },
  {
    label: "Observing AI Workflows",
    description: "Guidance about Genkit's various observability features and how to use them.",
    paths: [
      "unified-docs/observability/overview",
      "unified-docs/observability-monitoring",
      "unified-docs/observability/authentication",
      "unified-docs/observability/advanced-configuration",
      "unified-docs/observability/troubleshooting",
    ],
  },
  {
    label: "Writing Plugins",
    description: "Guidance about how to author plugins for Genkit.",
    paths: [
      "unified-docs/plugin-authoring/overview",
      "unified-docs/plugin-authoring/models",
    ],
  },
  {
    label: "AI Providers",
    description: "Provider-specific documentation for AI model providers and integrations.",
    paths: [
      "unified-docs/plugins/google-ai",
      "unified-docs/plugins/vertex-ai",
      "unified-docs/plugins/openai",
      "unified-docs/plugins/anthropic",
      "unified-docs/plugins/xai",
      "unified-docs/plugins/deepseek",
      "unified-docs/plugins/ollama",
    ],
  },
  {
    label: "Vector Databases",
    description: "Documentation for vector database integrations and retrieval systems.",
    paths: [
      "unified-docs/vector-databases/dev-local-vectorstore",
      "unified-docs/vector-databases/pinecone",
      "unified-docs/vector-databases/chromadb",
      "unified-docs/vector-databases/pgvector",
      "unified-docs/vector-databases/lancedb",
      "unified-docs/vector-databases/astra-db",
      "unified-docs/vector-databases/neo4j",
      "unified-docs/vector-databases/cloud-sql-postgresql",
      "unified-docs/vector-databases/cloud-firestore",
    ],
  },
  {
    label: "Developer Tools",
    description: "Documentation for development tools, MCP server, and local development.",
    paths: [
      "unified-docs/developer-tools",
      "unified-docs/mcp-server",
    ],
  },
];

export function extractFrontmatterAndBody(source: string) {
  const match = source.match(FRONTMATTER_AND_BODY_REGEX);
  if (match) {
    const [, frontmatter, body] = match;
    return { frontmatter: parse(frontmatter), body };
  }
  return { frontmatter: {}, body: source };
}

function extractLanguageContent(content: string): ProcessedDoc['content'] {
  const result = {
    js: '',
    go: '',
    python: '',
    common: ''
  };

  // Extract all LanguageContent blocks
  const languageBlocks: Array<{ lang: string; content: string; start: number; end: number }> = [];
  let match;
  
  while ((match = LANGUAGE_CONTENT_REGEX.exec(content)) !== null) {
    languageBlocks.push({
      lang: match[1],
      content: match[2].trim(),
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // Extract common content (everything outside LanguageContent blocks)
  let commonContent = content;
  for (let i = languageBlocks.length - 1; i >= 0; i--) {
    const block = languageBlocks[i];
    commonContent = commonContent.slice(0, block.start) + commonContent.slice(block.end);
  }

  // Clean up common content
  result.common = commonContent
    .replace(IMPORT_REGEX, '') // Remove import statements
    .replace(COMPONENT_REGEX, '') // Remove React/Astro components
    .replace(ASTRO_DIRECTIVE_REGEX, '') // Remove Astro directives like :::caution
    .replace(LINK_BUTTON_REGEX, '') // Remove LinkButton components
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
    .trim();

  // Process language-specific content
  for (const block of languageBlocks) {
    const lang = block.lang.toLowerCase();
    if (lang === 'js' || lang === 'javascript') {
      result.js += block.content + '\n\n';
    } else if (lang === 'go') {
      result.go += block.content + '\n\n';
    } else if (lang === 'python') {
      result.python += block.content + '\n\n';
    }
  }

  // Trim trailing whitespace
  result.js = result.js.trim();
  result.go = result.go.trim();
  result.python = result.python.trim();

  return result;
}

async function processUnifiedDoc(filePath: string): Promise<ProcessedDoc | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const { frontmatter, body } = extractFrontmatterAndBody(content);
    
    if (!frontmatter.title) {
      return null; // Skip files without titles
    }

    const processedContent = extractLanguageContent(body);
    
    return {
      title: frontmatter.title,
      description: frontmatter.description,
      content: processedContent,
      path: filePath
    };
  } catch (error) {
    console.warn(`Failed to process ${filePath}:`, error);
    return null;
  }
}

function generateLanguageSpecificContent(docs: ProcessedDoc[], language: 'js' | 'go' | 'python'): string {
  const languageNames = {
    js: 'JavaScript',
    go: 'Go',
    python: 'Python'
  };

  let content = `# Genkit Documentation - ${languageNames[language]}\n\n`;
  content += `> Open-source GenAI toolkit for ${languageNames[language]}.\n\n`;

  for (const doc of docs) {
    const langContent = doc.content[language];
    const commonContent = doc.content.common;
    
    // Only include docs that have content for this language or common content
    if (langContent || commonContent) {
      content += `## ${doc.title}\n\n`;
      
      if (doc.description) {
        content += `${doc.description}\n\n`;
      }
      
      // Add common content first
      if (commonContent) {
        content += `${commonContent}\n\n`;
      }
      
      // Add language-specific content
      if (langContent) {
        content += `${langContent}\n\n`;
      }
      
      content += '---\n\n';
    }
  }

  return content;
}

function generateLanguageSpecificSet(docs: ProcessedDoc[], set: LanguageSet, language: 'js' | 'go' | 'python'): string {
  const languageNames = {
    js: 'JavaScript',
    go: 'Go',
    python: 'Python'
  };

  let content = `# ${set.label} - ${languageNames[language]}\n\n`;
  content += `${set.description}\n\n`;

  // Filter docs that are in this set
  const setDocs = docs.filter(doc => 
    set.paths.some(setPath => doc.path.includes(setPath.replace('unified-docs/', '')))
  );

  for (const doc of setDocs) {
    const langContent = doc.content[language];
    const commonContent = doc.content.common;
    
    // Only include docs that have content for this language or common content
    if (langContent || commonContent) {
      content += `## ${doc.title}\n\n`;
      
      if (doc.description) {
        content += `${doc.description}\n\n`;
      }
      
      // Add common content first
      if (commonContent) {
        content += `${commonContent}\n\n`;
      }
      
      // Add language-specific content
      if (langContent) {
        content += `${langContent}\n\n`;
      }
      
      content += '---\n\n';
    }
  }

  return content;
}

async function generateMainLlmsTxt(): Promise<string> {
  const content = `# Genkit

> Open-source GenAI toolkit for JS, Go, and Python.

## Documentation Sets

- [JavaScript documentation](https://genkit.dev/llms-js.txt): Genkit documentation focused on JavaScript/TypeScript
- [Go documentation](https://genkit.dev/llms-go.txt): Genkit documentation focused on Go
- [Python documentation](https://genkit.dev/llms-python.txt): Genkit documentation focused on Python

### Language-Specific Thematic Sets

#### JavaScript
- [Building AI Workflows - JS](https://genkit.dev/_llms-txt/building-ai-workflows-js.txt): Guidance on how to generate content and interact with LLM and image models using Genkit in JavaScript.
- [Deploying AI Workflows - JS](https://genkit.dev/_llms-txt/deploying-ai-workflows-js.txt): Guidance on how to deploy Genkit code to various environments using JavaScript.
- [Observing AI Workflows - JS](https://genkit.dev/_llms-txt/observing-ai-workflows-js.txt): Guidance about Genkit's various observability features in JavaScript.
- [Writing Plugins - JS](https://genkit.dev/_llms-txt/writing-plugins-js.txt): Guidance about how to author plugins for Genkit in JavaScript.
- [AI Providers - JS](https://genkit.dev/_llms-txt/ai-providers-js.txt): Provider-specific documentation for AI model providers in JavaScript.
- [Vector Databases - JS](https://genkit.dev/_llms-txt/vector-databases-js.txt): Documentation for vector database integrations in JavaScript.

#### Go
- [Building AI Workflows - Go](https://genkit.dev/_llms-txt/building-ai-workflows-go.txt): Guidance on how to generate content and interact with LLM and image models using Genkit in Go.
- [Deploying AI Workflows - Go](https://genkit.dev/_llms-txt/deploying-ai-workflows-go.txt): Guidance on how to deploy Genkit code to various environments using Go.
- [Observing AI Workflows - Go](https://genkit.dev/_llms-txt/observing-ai-workflows-go.txt): Guidance about Genkit's various observability features in Go.
- [Writing Plugins - Go](https://genkit.dev/_llms-txt/writing-plugins-go.txt): Guidance about how to author plugins for Genkit in Go.
- [AI Providers - Go](https://genkit.dev/_llms-txt/ai-providers-go.txt): Provider-specific documentation for AI model providers in Go.
- [Vector Databases - Go](https://genkit.dev/_llms-txt/vector-databases-go.txt): Documentation for vector database integrations in Go.

#### Python
- [Building AI Workflows - Python](https://genkit.dev/_llms-txt/building-ai-workflows-python.txt): Guidance on how to generate content and interact with LLM and image models using Genkit in Python.
- [Deploying AI Workflows - Python](https://genkit.dev/_llms-txt/deploying-ai-workflows-python.txt): Guidance on how to deploy Genkit code to various environments using Python.
- [Observing AI Workflows - Python](https://genkit.dev/_llms-txt/observing-ai-workflows-python.txt): Guidance about Genkit's various observability features in Python.
- [Writing Plugins - Python](https://genkit.dev/_llms-txt/writing-plugins-python.txt): Guidance about how to author plugins for Genkit in Python.
- [AI Providers - Python](https://genkit.dev/_llms-txt/ai-providers-python.txt): Provider-specific documentation for AI model providers in Python.
- [Vector Databases - Python](https://genkit.dev/_llms-txt/vector-databases-python.txt): Documentation for vector database integrations in Python.

### Developer Tools
- [Developer Tools](https://genkit.dev/_llms-txt/developer-tools.txt): Documentation for development tools, MCP server, and local development.

## Notes

- Language-specific versions filter content to show only relevant examples and instructions for that language
- The content is automatically generated from the same source as the official documentation
- [Complete documentation](https://genkit.dev/llms-full.txt): Full unfiltered documentation (primarily for internal use)
`;

  return content;
}

export async function processUnifiedDocs(): Promise<void> {
  console.log('Processing unified documentation for language-specific llms.txt generation...');
  
  const unifiedDocsDir = 'src/content/docs/unified-docs';
  const outputDir = 'public';
  
  // Find all MDX files in unified-docs
  const allFiles = await readdir(unifiedDocsDir, { recursive: true });
  const mdxFiles = allFiles
    .filter(f => f.endsWith('.mdx'))
    .map(f => path.join(unifiedDocsDir, f));
  
  // Process all documents
  const processedDocs: ProcessedDoc[] = [];
  for (const file of mdxFiles) {
    const doc = await processUnifiedDoc(file);
    if (doc) {
      processedDocs.push(doc);
    }
  }
  
  console.log(`Processed ${processedDocs.length} unified documentation files`);
  
  // Generate main llms.txt
  const mainContent = await generateMainLlmsTxt();
  await writeFile(path.join(outputDir, 'llms.txt'), mainContent);
  console.log('Generated main llms.txt');
  
  // Generate language-specific complete documentation
  const languages: Array<'js' | 'go' | 'python'> = ['js', 'go', 'python'];
  
  for (const lang of languages) {
    const content = generateLanguageSpecificContent(processedDocs, lang);
    await writeFile(path.join(outputDir, `llms-${lang}.txt`), content);
    console.log(`Generated llms-${lang}.txt`);
  }
  
  // Generate language-specific thematic sets
  for (const lang of languages) {
    for (const set of LANGUAGE_SETS) {
      const content = generateLanguageSpecificSet(processedDocs, set, lang);
      const filename = `${set.label.toLowerCase().replace(/\s+/g, '-')}-${lang}.txt`;
      await writeFile(path.join(outputDir, '_llms-txt', filename), content);
    }
    console.log(`Generated thematic sets for ${lang}`);
  }
  
  // Generate developer tools (language-agnostic)
  const devToolsSet = LANGUAGE_SETS.find(s => s.label === 'Developer Tools');
  
  if (devToolsSet) {
    const content = generateLanguageSpecificSet(processedDocs, devToolsSet, 'js'); // Use js as base but will include common content
    await writeFile(path.join(outputDir, '_llms-txt', 'developer-tools.txt'), content);
  }
  
  console.log('Unified documentation processing complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processUnifiedDocs().catch(console.error);
}

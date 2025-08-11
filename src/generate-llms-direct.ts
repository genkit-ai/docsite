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

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getAllProcessedDocuments, type ProcessedDocument } from './utils/content-processor.js';

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

function generateLanguageSpecificContent(docs: ProcessedDocument[], language: 'js' | 'go' | 'python'): string {
  const languageNames = {
    js: 'JavaScript',
    go: 'Go',
    python: 'Python'
  };

  let content = `# Genkit Documentation - ${languageNames[language]}\n\n`;
  content += `> Open-source GenAI toolkit for ${languageNames[language]}.\n\n`;

  // Get all unique paths from all language sets
  const allPaths = [...new Set(LANGUAGE_SETS.flatMap(set => set.paths))];
  
  for (const docPath of allPaths) {
    const doc = docs.find(d => d.slug === docPath);
    if (doc && doc.content[language]) {
      content += `${doc.content[language]}\n\n---\n\n`;
    }
  }

  return content;
}

function generateLanguageSpecificSet(docs: ProcessedDocument[], set: LanguageSet, language: 'js' | 'go' | 'python'): string {
  const languageNames = {
    js: 'JavaScript',
    go: 'Go',
    python: 'Python'
  };

  let content = `# ${set.label} - ${languageNames[language]}\n\n`;
  content += `${set.description}\n\n`;

  for (const docPath of set.paths) {
    const doc = docs.find(d => d.slug === docPath);
    if (doc && doc.content[language]) {
      content += `${doc.content[language]}\n\n---\n\n`;
    }
  }

  return content;
}

function generateMainLlmsTxt(): string {
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

export async function generateLlmsDirectly(): Promise<void> {
  console.log('Generating llms.txt files directly from source files...');
  
  const outputDir = 'public';
  const llmsTxtDir = path.join(outputDir, '_llms-txt');
  
  // Ensure output directories exist
  await mkdir(llmsTxtDir, { recursive: true });
  
  // Process all documents
  console.log('Processing all documentation files...');
  const docs = await getAllProcessedDocuments();
  console.log(`Processed ${docs.length} documents`);
  
  // Generate main llms.txt
  const mainContent = generateMainLlmsTxt();
  await writeFile(path.join(outputDir, 'llms.txt'), mainContent);
  console.log('Generated main llms.txt');
  
  // Generate language-specific complete documentation
  const languages: Array<'js' | 'go' | 'python'> = ['js', 'go', 'python'];
  
  for (const lang of languages) {
    console.log(`Generating complete documentation for ${lang}...`);
    const content = generateLanguageSpecificContent(docs, lang);
    await writeFile(path.join(outputDir, `llms-${lang}.txt`), content);
    console.log(`Generated llms-${lang}.txt`);
  }
  
  // Generate language-specific thematic sets
  for (const lang of languages) {
    console.log(`Generating thematic sets for ${lang}...`);
    for (const set of LANGUAGE_SETS) {
      const content = generateLanguageSpecificSet(docs, set, lang);
      const filename = `${set.label.toLowerCase().replace(/\s+/g, '-')}-${lang}.txt`;
      await writeFile(path.join(llmsTxtDir, filename), content);
    }
    console.log(`Generated thematic sets for ${lang}`);
  }
  
  // Generate developer tools (language-agnostic, use js as base)
  const devToolsSet = LANGUAGE_SETS.find(s => s.label === 'Developer Tools');
  if (devToolsSet) {
    console.log('Generating developer tools documentation...');
    const content = generateLanguageSpecificSet(docs, devToolsSet, 'js');
    await writeFile(path.join(llmsTxtDir, 'developer-tools.txt'), content);
    console.log('Generated developer-tools.txt');
  }
  
  console.log('LLMs.txt generation from source files complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateLlmsDirectly().catch(console.error);
}

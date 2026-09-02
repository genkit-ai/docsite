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
import { rewriteInternalDocsLinks } from './utils/docs-link-routing.js';
import { sidebar } from './sidebar.js';

interface LanguageSet {
  label: string;
  description: string;
  paths: string[];
}

interface SidebarItem {
  label: string;
  slug?: string;
  items?: SidebarItem[];
}

// Extract paths from sidebar structure
function extractPathsFromSidebar(items: SidebarItem[]): string[] {
  const paths: string[] = [];
  
  for (const item of items) {
    if (item.slug) {
      paths.push(item.slug);
    }
    if (item.items) {
      paths.push(...extractPathsFromSidebar(item.items));
    }
  }
  
  return paths;
}

// Get the docs sidebar from the imported sidebar structure
function getDocsSidebar(): SidebarItem[] {
  // Filter out the Introduction item and return the rest
  return sidebar.filter(item => item.label !== "Introduction");
}

// Thematic bundles, defined against the section labels in src/sidebar.ts.
//
// `sections` are matched against sidebar section labels exactly. A theme that
// names a section which no longer exists is a build error rather than a silently
// empty bundle: an empty bundle still gets advertised in llms.txt, so the failure
// mode is a 404 or a near-empty file for whoever fetches it.
const THEMES: Array<{
  label: string;
  description: string;
  sections?: string[];
  slugs?: string[];
}> = [
  {
    label: "Building AI Workflows",
    description:
      "Generating content, flows, tools, prompts, RAG, and the rest of the core Genkit API.",
    sections: ["Get started", "Core concepts"],
  },
  {
    label: "Full-Stack Agents",
    description:
      "Defining agents, running and streaming them, sessions and state, interrupts, background execution, and delegation.",
    sections: ["Full-stack agents"],
  },
  {
    label: "Deploying AI Workflows",
    description:
      "Serving flows from a web framework, connecting a frontend, and deploying to Cloud Run or any other platform.",
    sections: ["Backend frameworks", "App frameworks", "Deployment", "Authorization"],
  },
  {
    label: "Observing AI Workflows",
    description: "Tracing, metrics, logging, and production monitoring.",
    sections: ["Observability and monitoring"],
  },
  {
    label: "Writing Plugins",
    description: "Authoring Genkit plugins: models, retrievers, embedders, and evaluators.",
    sections: ["Writing plugins"],
  },
  {
    label: "AI Providers",
    description: "Provider-specific setup and configuration for every supported model provider.",
    sections: ["Model providers"],
  },
  {
    label: "Vector Databases",
    description: "Vector store and retriever integrations.",
    sections: ["Database providers"],
  },
  {
    label: "Developer Tools",
    description: "The Genkit CLI, the Developer UI, the Genkit MCP server, and AI-assisted development.",
    sections: ["Build with AI"],
    slugs: ["docs/devtools"],
  },
];

// Create language sets based on sidebar structure
function createLanguageSetsFromSidebar(): LanguageSet[] {
  const docsSidebar = getDocsSidebar();
  const known = new Set(docsSidebar.map((item) => item.label));

  return THEMES.map((theme) => {
    const paths: string[] = [...(theme.slugs ?? [])];

    for (const label of theme.sections ?? []) {
      if (!known.has(label)) {
        throw new Error(
          `generate-llms-direct: theme "${theme.label}" references sidebar section "${label}", ` +
            `which does not exist. Known sections: ${[...known].join(", ")}. ` +
            `Update THEMES in src/generate-llms-direct.ts when the sidebar is reorganized.`,
        );
      }
      const section = docsSidebar.find((item) => item.label === label);
      if (section?.items) {
        paths.push(...extractPathsFromSidebar(section.items));
      }
    }

    return {
      label: theme.label,
      description: theme.description,
      paths: [...new Set(paths)],
    };
  });
}

// Generate language sets from sidebar
const LANGUAGE_SETS = createLanguageSetsFromSidebar();

// Every page in the sidebar, in sidebar order. The per-language bundles are
// built from this, not from the thematic sets, so a page that no theme happens
// to cover still reaches an agent that fetches llms-<lang>.txt.
const ALL_SIDEBAR_PATHS: string[] = [
  ...new Set(extractPathsFromSidebar(getDocsSidebar() as SidebarItem[])),
];

function setFilename(label: string, lang: Language): string {
  return `${label.toLowerCase().replace(/\s+/g, '-')}-${lang}.txt`;
}

type Language = 'js' | 'go' | 'dart' | 'python';

function generateLanguageSpecificContent(docs: ProcessedDocument[], language: Language): string {
  const languageNames = {
    js: 'JavaScript',
    go: 'Go',
    dart: 'Dart',
    python: 'Python',
  };

  let content = `# Genkit Documentation - ${languageNames[language]}\n\n`;
  content += `> Open-source GenAI toolkit for ${languageNames[language]}.\n\n`;
  content += `> This file is every ${languageNames[language]} documentation page, in sidebar order.\n\n`;

  // Every page that supports this language, in sidebar order.
  const allPaths = ALL_SIDEBAR_PATHS;

  for (const docPath of allPaths) {
    const doc = docs.find(d => d.slug === docPath);
    if (doc && doc.content[language] && doc.supportedLanguages.includes(language)) {
      const rewritten = rewriteInternalDocsLinks(doc.content[language], language, undefined, {
        context: `llms-${language}`,
        warnOnUnresolved: true,
      });
      content += `${rewritten}\n\n---\n\n`;
    }
  }

  return content;
}

function generateLanguageSpecificSet(docs: ProcessedDocument[], set: LanguageSet, language: Language): string {
  const languageNames = {
    js: 'JavaScript',
    go: 'Go',
    dart: 'Dart',
    python: 'Python',
  };

  let content = `# ${set.label} - ${languageNames[language]}\n\n`;
  content += `${set.description}\n\n`;

  for (const docPath of set.paths) {
    const doc = docs.find(d => d.slug === docPath);
    if (doc && doc.content[language] && doc.supportedLanguages.includes(language)) {
      const rewritten = rewriteInternalDocsLinks(doc.content[language], language, undefined, {
        context: `${set.label}-${language}`,
        warnOnUnresolved: true,
      });
      content += `${rewritten}\n\n---\n\n`;
    }
  }

  return content;
}

function generateFullDocumentation(docs: ProcessedDocument[]): string {
  let content = `# Genkit - Complete Documentation\n\n`;
  content += `> Open-source GenAI toolkit for JS, Go, Dart, and Python.\n`;
  content += `> This is the complete unfiltered documentation (primarily for internal use).\n\n`;

  const allPaths = [...ALL_SIDEBAR_PATHS].sort();

  for (const docPath of allPaths) {
    const doc = docs.find(d => d.slug === docPath);
    if (doc) {
      // Include all language content for each document
      const languages: Language[] = ['js', 'go', 'dart', 'python'];
      for (const lang of languages) {
        if (doc.content[lang] && doc.supportedLanguages.includes(lang)) {
          const rewritten = rewriteInternalDocsLinks(doc.content[lang], lang, undefined, {
            context: `llms-full-${lang}`,
            warnOnUnresolved: true,
          });
          content += `## ${docPath} (${lang.toUpperCase()})\n\n`;
          content += `${rewritten}\n\n---\n\n`;
        }
      }
    }
  }

  return content;
}

const LANGUAGE_NAMES: Record<Language, string> = {
  js: 'JavaScript/TypeScript',
  go: 'Go',
  dart: 'Dart',
  python: 'Python',
};

/**
 * Builds llms.txt from the bundles that were actually written, so the index can
 * never advertise a file that does not exist. `written` maps each language to
 * the thematic sets that produced content for it.
 */
function generateMainLlmsTxt(written: Map<Language, LanguageSet[]>): string {
  const languages: Language[] = ['js', 'go', 'dart', 'python'];

  let content = `# Genkit

> Open-source GenAI toolkit for JS, Go, Dart, and Python.

## Documentation Sets

Each of these is the complete documentation for one language, in sidebar order.

`;

  for (const lang of languages) {
    content += `- [${LANGUAGE_NAMES[lang]} documentation](https://genkit.dev/llms-${lang}.txt): every Genkit ${LANGUAGE_NAMES[lang]} page in one file\n`;
  }

  content += `
## Single Pages

Every documentation page is also served as markdown. Append \`.md\` to any docs
URL to fetch just that page:

- \`https://genkit.dev/docs/go/flows.md\` — the Go rendering of the Flows page
- \`https://genkit.dev/docs/js/flows.md\` — the JavaScript rendering of the same page

Use these when you know which page you need; use the language bundles above when
you do not.

## API Rules For Coding Agents

Condensed, opinionated rules for writing Genkit code, suitable for dropping into
an agent's system prompt or rules file:

- [Genkit Go API rules](https://genkit.dev/GENKIT.go.md)
- [Genkit JavaScript API rules](https://genkit.dev/GENKIT.js.md)

### Language-Specific Thematic Sets

Smaller bundles for one topic in one language. Only the combinations that have
content are listed.

`;

  for (const lang of languages) {
    const sets = written.get(lang) ?? [];
    if (sets.length === 0) continue;
    content += `#### ${LANGUAGE_NAMES[lang]}\n`;
    for (const set of sets) {
      content += `- [${set.label} - ${LANGUAGE_NAMES[lang]}](https://genkit.dev/_llms-txt/${setFilename(set.label, lang)}): ${set.description}\n`;
    }
    content += `\n`;
  }

  content += `## Notes

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
  
  // Generate complete unfiltered documentation (llms-full.txt)
  console.log('Generating complete unfiltered documentation...');
  const fullContent = generateFullDocumentation(docs);
  await writeFile(path.join(outputDir, 'llms-full.txt'), fullContent);
  console.log('Generated llms-full.txt');
  
  // Generate language-specific complete documentation
  const languages: Language[] = ['js', 'go', 'dart', 'python'];
  
  for (const lang of languages) {
    console.log(`Generating complete documentation for ${lang}...`);
    const content = generateLanguageSpecificContent(docs, lang);
    await writeFile(path.join(outputDir, `llms-${lang}.txt`), content);
    console.log(`Generated llms-${lang}.txt`);
  }
  
  // Generate language-specific thematic sets. A set with no pages for a language
  // is skipped rather than written empty, and only the sets actually written are
  // advertised in llms.txt.
  const written = new Map<Language, LanguageSet[]>();
  for (const lang of languages) {
    const producedForLang: LanguageSet[] = [];
    for (const set of LANGUAGE_SETS) {
      const pageCount = set.paths.filter((p) => {
        const doc = docs.find((d) => d.slug === p);
        return !!doc && !!doc.content[lang] && doc.supportedLanguages.includes(lang);
      }).length;
      if (pageCount === 0) {
        console.log(`  skipping ${setFilename(set.label, lang)} (no ${lang} pages)`);
        continue;
      }
      const content = generateLanguageSpecificSet(docs, set, lang);
      await writeFile(path.join(llmsTxtDir, setFilename(set.label, lang)), content);
      producedForLang.push(set);
    }
    written.set(lang, producedForLang);
    console.log(`Generated ${producedForLang.length} thematic sets for ${lang}`);
  }

  // llms.txt is written last so it can list exactly what exists.
  await writeFile(path.join(outputDir, 'llms.txt'), generateMainLlmsTxt(written));
  console.log('Generated main llms.txt');

  console.log('LLMs.txt generation from source files complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateLlmsDirectly().catch(console.error);
}

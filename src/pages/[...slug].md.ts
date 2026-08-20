import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import fs from 'node:fs/promises';
import { filterContentByLanguage, processRawContent } from '../utils/content-processor.js';

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  const LANGUAGES = ['js', 'go', 'dart', 'python'] as const;

  // Build an index of generated language-specific entries so neutral-slug requests can
  // prefer the canonical pre-filtered file over runtime filtering on the source.
  const generatedByLangSlug = new Map<string, (typeof docs)[number]>();
  for (const entry of docs) {
    const id = entry.id.replace(/\.(md|mdx)$/, '');
    const langPrefixMatch = id.match(/^(js|go|dart|python)\/(.+)$/);
    if (langPrefixMatch) {
      generatedByLangSlug.set(`${langPrefixMatch[1]}:${langPrefixMatch[2]}`, entry);
    }
  }

  const paths = (
    await Promise.all(
      docs.map(async (entry) => {
        const filePath = entry.filePath;
        const slug = entry.id.replace(/\.(md|mdx)$/, '');

        if (!filePath) {
          console.warn(`Skipping entry with missing filePath: ${entry.id}`);
          return {
            params: { slug },
            props: { processedContent: '' },
          };
        }

        // Skip generated language entries here; they emit their own slug-level paths via the
        // ordinary loop below (slug is already `js/...` etc.), and we route neutral requests
        // through generatedByLangSlug.
        const isGenerated = /^(js|go|dart|python)\//.test(slug);

        const entryPaths: Array<{ params: { slug: string }; props: any }> = [];
        const title = entry.data.title;

        try {
          const rawContent = await fs.readFile(filePath, 'utf-8');
          const standardProcessedContent = await processRawContent(rawContent, title, filePath);

          const supportedLanguages = entry.data.supportedLanguages || [...LANGUAGES];

          // Default path emits this entry as-is at its own slug.
          entryPaths.push({
            params: { slug },
            props: {
              processedContent: standardProcessedContent,
              rawContent: standardProcessedContent,
              title,
              language: isGenerated ? slug.split('/')[0] : 'js',
            },
          });

          // Only neutral (non-language-prefixed) entries fan out into `slug.{lang}.md` variants.
          if (!isGenerated) {
            for (const lang of LANGUAGES) {
              if (!supportedLanguages.includes(lang)) continue;

              // Prefer the canonical generated file when available; fall back to runtime filtering.
              const generatedEntry = generatedByLangSlug.get(`${lang}:${slug}`);
              let langContent: string;
              if (generatedEntry?.filePath) {
                const generatedRaw = await fs.readFile(generatedEntry.filePath, 'utf-8');
                langContent = await processRawContent(
                  generatedRaw,
                  generatedEntry.data.title || title,
                  generatedEntry.filePath,
                );
              } else {
                langContent = filterContentByLanguage(standardProcessedContent, lang);
              }
              entryPaths.push({
                params: { slug: `${slug}.${lang}` },
                props: {
                  processedContent: langContent,
                  rawContent: langContent,
                  title,
                  language: lang,
                },
              });
            }
          }
        } catch (err) {
          console.error(`Error reading or processing file for slug ${slug} (${filePath}}):`, err);
        }

        return entryPaths;
      }),
    )
  ).flatMap((paths) => paths);

  return paths.filter((p) => p.props.processedContent);
}

// GET function returns the pre-processed content
export async function GET({
  props,
}: APIContext<{ processedContent: string; rawContent?: string; title?: string; language?: string }>) {
  return new Response(props.processedContent, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

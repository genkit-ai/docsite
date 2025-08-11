import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import fs from 'node:fs/promises';
import { filterContentByLanguage, normalizeLanguage, processRawContent } from '../utils/content-processor.js';

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  // Use flatMap to handle entries potentially generating multiple paths
  const paths = (
    await Promise.all(
      docs.map(async (entry) => {
        const filePath = entry.filePath; // Use provided absolute path
        // Derive slug from entry.id
        const slug = entry.id.replace(/\.(md|mdx)$/, '');

        // --- Add check for filePath ---
        if (!filePath) {
          console.warn(`Skipping entry with missing filePath: ${entry.id}`);
          // Return a structure that will be filtered out later
          return {
            params: { slug: slug }, // Use derived slug
            props: { processedContent: '' },
          };
        }
        // --- End check ---

        const entryPaths = []; // Array to hold paths generated for this entry
        const title = entry.data.title; // Get title for reuse

        try {
          const rawContent = await fs.readFile(filePath, 'utf-8');

          // Use shared processing logic for all content (LLMSummary is now stripped automatically)
          const standardProcessedContent = processRawContent(rawContent, title);

          // Add paths for each language
          const languages = ['js', 'go', 'python'];
          
          // Default path (JavaScript)
          entryPaths.push({
            params: { slug: slug },
            props: { 
              processedContent: standardProcessedContent,
              rawContent: standardProcessedContent,
              title: title,
              language: 'js'
            },
          });
          
          // Language-specific paths
          languages.forEach(lang => {
            const filteredContent = filterContentByLanguage(standardProcessedContent, lang);
            entryPaths.push({
              params: { slug: `${slug}.${lang}` },
              props: { 
                processedContent: filteredContent,
                rawContent: filteredContent,
                title: title,
                language: lang
              },
            });
          });
          // --- End Content Processing ---
        } catch (err) {
          console.error(`Error reading or processing file for slug ${slug} (${filePath}}):`, err);
          // If error, entryPaths remains empty and gets filtered out later
        }

        return entryPaths; // Return array of paths for this entry
      }),
    )
  ).flatMap((paths) => paths); // Flatten the array of arrays

  // Filter out entries where processing failed (props.processedContent is empty or paths array is empty)
  return paths.filter((p) => p.props.processedContent);
}

// GET function returns the pre-processed content
export async function GET({ props }: APIContext<{ processedContent: string; rawContent?: string; title?: string; language?: string }>) {
  return new Response(props.processedContent, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

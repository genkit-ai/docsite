import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import fs from "node:fs/promises";
// 'path' module is not needed when using entry.filePath directly

export async function getStaticPaths() {
  const docs = await getCollection("docs");
  // Use flatMap to handle entries potentially generating multiple paths
  const paths = (
    await Promise.all(
      docs.map(async (entry) => {
        const filePath = entry.filePath; // Use provided absolute path
        // Derive slug from entry.id
        const slug = entry.id.replace(/\.(md|mdx)$/, "");

        // --- Add check for filePath ---
        if (!filePath) {
          console.warn(`Skipping entry with missing filePath: ${entry.id}`);
          // Return a structure that will be filtered out later
          return {
            params: { slug: slug }, // Use derived slug
            props: { processedContent: "" },
          };
        }
        // --- End check ---

        const entryPaths = []; // Array to hold paths generated for this entry
        const title = entry.data.title; // Get title for reuse

        try {
          const rawContent = await fs.readFile(filePath, "utf-8");

          // --- Check for <LLMs> tag ---
          const llmMatch = rawContent.match(
            /<LLMSummary>([\s\S]*?)<\/LLMSummary>/
          );

          if (llmMatch && llmMatch[1]) {
            // --- Case 1: <LLMs> tag found ---
            const llmContent = llmMatch[1].trim();

            // 1a. Generate primary .md path (LLM content + title)
            const primaryContent = `# ${title}\n\n${llmContent}`;
            entryPaths.push({
              params: { slug: slug },
              props: { processedContent: primaryContent },
            });

            // 1b. Generate .full.md path (Processed full content + title)
            //    Apply standard frontmatter/import removal to the *entire* raw content
            let fullProcessedContent = rawContent
              .replace(/^---\s*[\s\S]*?---/, "")
              .trim();
            const fullLines = fullProcessedContent.split("\n");
            let fullFirstNonImportIndex = 0;
            for (let i = 0; i < fullLines.length; i++) {
              const trimmedLine = fullLines[i].trim();
              if (trimmedLine.startsWith("import ")) {
                fullFirstNonImportIndex = i + 1;
              } else if (trimmedLine === "") {
                fullFirstNonImportIndex = i + 1;
              } else {
                break;
              }
            }
            fullProcessedContent = fullLines
              .slice(fullFirstNonImportIndex)
              .join("\n")
              .trim();
            fullProcessedContent = `# ${title}\n\n${fullProcessedContent}`; // Prepend title

            entryPaths.push({
              params: { slug: slug + ".full" }, // Append .full to slug
              props: { processedContent: fullProcessedContent },
            });
          } else {
            // --- Case 2: <LLMs> tag NOT found ---
            // Apply standard processing:

            // 2a. Remove frontmatter block
            let standardProcessedContent = rawContent
              .replace(/^---\s*[\s\S]*?---/, "")
              .trim();

            // 2b. Remove ONLY leading import statements
            const lines = standardProcessedContent.split("\n");
            let firstNonImportIndex = 0;
            for (let i = 0; i < lines.length; i++) {
              const trimmedLine = lines[i].trim();
              if (trimmedLine.startsWith("import ")) {
                // Still in the import block, mark next line as potential start of content
                firstNonImportIndex = i + 1;
              } else if (trimmedLine === "") {
                // Empty line, potentially between imports, mark next line as potential start
                firstNonImportIndex = i + 1;
              } else {
                // Found the first non-empty, non-import line, stop searching
                break;
              }
            }
            // Keep lines from the first non-import line onwards
            standardProcessedContent = lines
              .slice(firstNonImportIndex)
              .join("\n")
              .trim();

            // 2c. Prepend H1 title
            standardProcessedContent = `# ${title}\n\n${standardProcessedContent}`;

            // Add the single path for standard processing
            entryPaths.push({
              params: { slug: slug },
              props: { processedContent: standardProcessedContent },
            });
          }
          // --- End Content Processing ---
        } catch (err) {
          console.error(
            `Error reading or processing file for slug ${slug} (${filePath}}):`,
            err
          );
          // If error, entryPaths remains empty and gets filtered out later
        }

        return entryPaths; // Return array of paths for this entry
      })
    )
  ).flatMap((paths) => paths); // Flatten the array of arrays

  // Filter out entries where processing failed (props.processedContent is empty or paths array is empty)
  return paths.filter((p) => p.props.processedContent);
}

// The GET function remains the same, using the processedContent from props
export async function GET({ props }: APIContext<{ processedContent: string }>) {
  return new Response(props.processedContent, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

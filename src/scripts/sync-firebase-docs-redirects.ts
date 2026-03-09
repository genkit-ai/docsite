import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  chooseCanonicalLanguage,
  getAllSourceDocsPathMetadata,
} from '../utils/docs-link-routing.js';

type RedirectRule = {
  source: string;
  destination: string;
  type: number;
};

type FirebaseConfig = {
  hosting:
    | {
        redirects?: RedirectRule[];
      }
    | Array<{
        redirects?: RedirectRule[];
      }>;
};

function buildCanonicalDocRedirects(): RedirectRule[] {
  const metadataByPath = getAllSourceDocsPathMetadata();
  const redirects: RedirectRule[] = [];

  for (const [basePath, metadata] of Object.entries(metadataByPath)) {
    if (metadata.isLanguageAgnostic) {
      continue;
    }

    const canonicalLanguage = chooseCanonicalLanguage(metadata.supportedLanguages);
    if (!canonicalLanguage) {
      continue;
    }

    const slugPath = basePath.replace(/^\/docs\//, '');
    const destination = `/docs/${canonicalLanguage}/${slugPath}/`;
    redirects.push(
      { source: `${basePath}/`, destination, type: 301 },
      { source: basePath, destination, type: 301 },
    );
  }

  return redirects.sort((a, b) => a.source.localeCompare(b.source));
}

async function main() {
  const firebasePath = path.resolve('firebase.json');
  const config = JSON.parse(await readFile(firebasePath, 'utf8')) as FirebaseConfig;
  const hosting = Array.isArray(config.hosting) ? config.hosting[0] : config.hosting;
  const existingRedirects = hosting.redirects || [];
  const generatedRedirects = buildCanonicalDocRedirects();
  const generatedSources = new Set(generatedRedirects.map((redirect) => redirect.source));

  const preservedRedirects = existingRedirects.filter((redirect) => !generatedSources.has(redirect.source));
  const firstDocsRedirectIndex = preservedRedirects.findIndex((redirect) => redirect.source.startsWith('/docs/'));
  const insertIndex = firstDocsRedirectIndex === -1 ? preservedRedirects.length : firstDocsRedirectIndex;

  hosting.redirects = [
    ...preservedRedirects.slice(0, insertIndex),
    ...generatedRedirects,
    ...preservedRedirects.slice(insertIndex),
  ];

  await writeFile(firebasePath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Synced ${generatedRedirects.length} canonical neutral docs redirects in firebase.json`);
}

await main();

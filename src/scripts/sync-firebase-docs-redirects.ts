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

function redirectKey({ source, destination, type }: RedirectRule): string {
  return `${source}\n${destination}\n${type}`;
}

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
  const checkOnly = process.argv.includes('--check');
  const firebasePath = path.resolve('firebase.json');
  const original = await readFile(firebasePath, 'utf8');
  const config = JSON.parse(original) as FirebaseConfig;
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

  const synced = `${JSON.stringify(config, null, 2)}\n`;

  if (checkOnly) {
    if (synced === original) {
      console.log(`firebase.json has all ${generatedRedirects.length} canonical neutral docs redirects`);
      return;
    }
    const existingKeys = new Set(existingRedirects.map(redirectKey));
    const missing = generatedRedirects.filter((redirect) => !existingKeys.has(redirectKey(redirect)));
    console.error('firebase.json is out of sync with the docs source. Run `pnpm sync-firebase-docs-redirects`.');
    for (const redirect of missing) {
      console.error(`  missing: ${redirect.source} -> ${redirect.destination}`);
    }
    process.exitCode = 1;
    return;
  }

  await writeFile(firebasePath, synced);
  console.log(`Synced ${generatedRedirects.length} canonical neutral docs redirects in firebase.json`);
}

await main();

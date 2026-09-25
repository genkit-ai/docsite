import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  chooseCanonicalLanguage,
  getAllSourceDocsPathMetadata,
  type DocsPathMetadataMap,
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

function buildCanonicalDocRedirects(metadataByPath: DocsPathMetadataMap): RedirectRule[] {
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

function describeDrift(
  existing: RedirectRule[],
  generated: RedirectRule[],
  ownedSources: Set<string>,
): string[] {
  const existingBySource = new Map(existing.map((redirect) => [redirect.source, redirect]));
  const generatedSources = new Set(generated.map((redirect) => redirect.source));
  const lines: string[] = [];

  for (const redirect of generated) {
    const current = existingBySource.get(redirect.source);
    if (!current) {
      lines.push(`missing: ${redirect.source} -> ${redirect.destination}`);
    } else if (current.destination !== redirect.destination || current.type !== redirect.type) {
      lines.push(
        `changed: ${redirect.source} -> ${current.destination} (${current.type}), expected ${redirect.destination} (${redirect.type})`,
      );
    }
  }

  for (const redirect of existing) {
    if (ownedSources.has(redirect.source) && !generatedSources.has(redirect.source)) {
      lines.push(`stale: ${redirect.source} -> ${redirect.destination}`);
    }
  }

  return lines.length > 0 ? lines : ['redirect order differs from the generated order'];
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const firebasePath = path.resolve('firebase.json');
  const config = JSON.parse(await readFile(firebasePath, 'utf8')) as FirebaseConfig;
  const hosting = Array.isArray(config.hosting) ? config.hosting[0] : config.hosting;
  const existingRedirects = hosting.redirects || [];
  const metadataByPath = getAllSourceDocsPathMetadata();
  const generatedRedirects = buildCanonicalDocRedirects(metadataByPath);
  // Every source page's neutral path belongs to this script, so language-agnostic pages drop stale redirects.
  const ownedSources = new Set(Object.keys(metadataByPath).flatMap((basePath) => [basePath, `${basePath}/`]));

  const preservedRedirects = existingRedirects.filter((redirect) => !ownedSources.has(redirect.source));
  const firstDocsRedirectIndex = preservedRedirects.findIndex((redirect) => redirect.source.startsWith('/docs/'));
  const insertIndex = firstDocsRedirectIndex === -1 ? preservedRedirects.length : firstDocsRedirectIndex;

  const syncedRedirects = [
    ...preservedRedirects.slice(0, insertIndex),
    ...generatedRedirects,
    ...preservedRedirects.slice(insertIndex),
  ];

  if (checkOnly) {
    if (JSON.stringify(syncedRedirects) === JSON.stringify(existingRedirects)) {
      console.log(`firebase.json has all ${generatedRedirects.length} canonical neutral docs redirects`);
      return;
    }
    console.error('firebase.json is out of sync with the docs source. Run `pnpm sync-firebase-docs-redirects`.');
    for (const line of describeDrift(existingRedirects, generatedRedirects, ownedSources)) {
      console.error(`  ${line}`);
    }
    process.exitCode = 1;
    return;
  }

  hosting.redirects = syncedRedirects;
  await writeFile(firebasePath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Synced ${generatedRedirects.length} canonical neutral docs redirects in firebase.json`);
}

await main();

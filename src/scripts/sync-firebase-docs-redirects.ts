import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chooseCanonicalLanguage,
  getAllSourceDocsPathMetadata,
  LANGUAGE_FALLBACK_ORDER,
  type DocsPathMetadataMap,
} from '../utils/docs-link-routing.js';

export type RedirectRule = {
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

export function buildCanonicalDocRedirects(
  metadataByPath: DocsPathMetadataMap = getAllSourceDocsPathMetadata(),
): RedirectRule[] {
  const redirects: RedirectRule[] = [];

  for (const [basePath, metadata] of Object.entries(metadataByPath)) {
    const slugPath = basePath.replace(/^\/docs\//, '');

    if (metadata.isLanguageAgnostic) {
      const destination = `/docs/${slugPath}/`;
      for (const language of LANGUAGE_FALLBACK_ORDER) {
        redirects.push(
          { source: `/docs/${language}/${slugPath}/`, destination, type: 301 },
          { source: `/docs/${language}/${slugPath}`, destination, type: 301 },
        );
      }
      continue;
    }

    const canonicalLanguage = chooseCanonicalLanguage(metadata.supportedLanguages);
    if (!canonicalLanguage) {
      continue;
    }

    const destination = `/docs/${canonicalLanguage}/${slugPath}/`;
    redirects.push(
      { source: `${basePath}/`, destination, type: 301 },
      { source: basePath, destination, type: 301 },
    );

    for (const language of LANGUAGE_FALLBACK_ORDER) {
      if (metadata.supportedLanguages.includes(language)) {
        continue;
      }
      redirects.push(
        { source: `/docs/${language}/${slugPath}/`, destination, type: 301 },
        { source: `/docs/${language}/${slugPath}`, destination, type: 301 },
      );
    }
  }

  return redirects.sort((a, b) => a.source.localeCompare(b.source));
}

export function buildManagedDocRedirectSources(
  metadataByPath: DocsPathMetadataMap = getAllSourceDocsPathMetadata(),
): Set<string> {
  const managed = new Set<string>();
  for (const basePath of Object.keys(metadataByPath)) {
    const slugPath = basePath.replace(/^\/docs\//, '');
    managed.add(basePath);
    managed.add(`${basePath}/`);
    for (const language of LANGUAGE_FALLBACK_ORDER) {
      managed.add(`/docs/${language}/${slugPath}`);
      managed.add(`/docs/${language}/${slugPath}/`);
    }
  }
  return managed;
}

export function applySyncedDocRedirects(
  existingRedirects: RedirectRule[],
  metadataByPath: DocsPathMetadataMap = getAllSourceDocsPathMetadata(),
): RedirectRule[] {
  const generatedRedirects = buildCanonicalDocRedirects(metadataByPath);
  const managedSources = buildManagedDocRedirectSources(metadataByPath);

  const preservedRedirects = existingRedirects.filter(
    (redirect) => !managedSources.has(redirect.source),
  );
  const firstDocsRedirectIndex = preservedRedirects.findIndex((redirect) =>
    redirect.source.startsWith('/docs/'),
  );
  const insertIndex =
    firstDocsRedirectIndex === -1 ? preservedRedirects.length : firstDocsRedirectIndex;

  return [
    ...preservedRedirects.slice(0, insertIndex),
    ...generatedRedirects,
    ...preservedRedirects.slice(insertIndex),
  ];
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const firebasePath = path.resolve('firebase.json');
  const rawOriginal = await readFile(firebasePath, 'utf8');
  const config = JSON.parse(rawOriginal) as FirebaseConfig;
  const hosting = Array.isArray(config.hosting) ? config.hosting[0] : config.hosting;
  const existingRedirects = hosting.redirects || [];
  const metadataByPath = getAllSourceDocsPathMetadata();
  const generatedRedirects = buildCanonicalDocRedirects(metadataByPath);

  hosting.redirects = applySyncedDocRedirects(existingRedirects, metadataByPath);

  const serialized = `${JSON.stringify(config, null, 2)}\n`;
  if (checkOnly) {
    if (serialized !== rawOriginal) {
      throw new Error(
        'firebase.json redirects are out of sync with source docs metadata. Run: pnpm sync-firebase-docs-redirects',
      );
    }
    console.log(
      `Verified ${generatedRedirects.length} canonical & unsupported-language docs redirects in firebase.json`,
    );
    return;
  }

  await writeFile(firebasePath, serialized);
  console.log(
    `Synced ${generatedRedirects.length} canonical & unsupported-language docs redirects in firebase.json`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

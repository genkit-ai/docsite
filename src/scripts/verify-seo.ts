import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RedirectRule } from './sync-firebase-docs-redirects.js';

export type HeaderRule = {
  glob: string;
  headers: Array<{ key: string; value: string }>;
};

export type FirebaseHostingConfig = {
  headers?: HeaderRule[];
  redirects?: RedirectRule[];
};

export type VerifySeoOptions = {
  distDir: string;
  hosting?: FirebaseHostingConfig | null;
  siteOrigin?: string;
  minSitemapUrls?: number;
};

const DEFAULT_SITE_ORIGIN = 'https://genkit.dev';
const DEFAULT_MIN_SITEMAP_URLS = 250;

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

function resolveDistFileForPath(distDir: string, urlPathname: string): string | null {
  const candidates = urlPathname.endsWith('/')
    ? [path.join(distDir, urlPathname, 'index.html')]
    : [
        path.join(distDir, urlPathname),
        path.join(distDir, `${urlPathname}.html`),
        path.join(distDir, urlPathname, 'index.html'),
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

export function verifySeoBuild({
  distDir,
  hosting,
  siteOrigin = DEFAULT_SITE_ORIGIN,
  minSitemapUrls = DEFAULT_MIN_SITEMAP_URLS,
}: VerifySeoOptions): string[] {
  const errors: string[] = [];
  if (!hosting || typeof hosting !== 'object' || Array.isArray(hosting)) {
    errors.push('firebase.json is missing a valid "hosting" configuration.');
  }
  const redirects = hosting?.redirects ?? [];
  const headers = hosting?.headers ?? [];

  // 1. Validate firebase.json headers
  for (const rule of headers) {
    if (rule.glob === '/**/*.xml') {
      errors.push(
        'firebase.json headers must not use overly broad "/**/*.xml" glob (causes 404 HTML fallbacks on missing .xml URLs to be served as application/xml).',
      );
    }
    const hasNoindex = rule.headers.some(
      (header) =>
        header.key.toLowerCase() === 'x-robots-tag' &&
        header.value.toLowerCase().includes('noindex'),
    );
    if (
      hasNoindex &&
      (rule.glob === '/**' ||
        rule.glob.includes('.html') ||
        rule.glob.includes('sitemap') ||
        rule.glob === '/')
    ) {
      errors.push(`firebase.json headers must not apply X-Robots-Tag: noindex to "${rule.glob}".`);
    }
  }

  // 2. Validate firebase.json redirects (duplicates, loops, chains, broken destinations)
  const redirectBySource = new Map<string, RedirectRule>();
  for (const rule of redirects) {
    if (redirectBySource.has(rule.source)) {
      errors.push(`Duplicate redirect source in firebase.json: "${rule.source}".`);
    }
    redirectBySource.set(rule.source, rule);
  }

  for (const rule of redirects) {
    if (/^https?:\/\//i.test(rule.destination)) {
      continue;
    }
    const parsedDest = new URL(rule.destination, siteOrigin);
    const destPath = parsedDest.pathname;
    const destNoSlash = destPath.replace(/\/+$/, '') || '/';
    const sourceNoSlash = rule.source.replace(/\/+$/, '') || '/';

    if (rule.source === destPath) {
      errors.push(`Redirect loop in firebase.json: "${rule.source}" -> "${rule.destination}".`);
      continue;
    }

    if (redirectBySource.has(destPath)) {
      errors.push(
        `Multi-hop redirect chain in firebase.json: "${rule.source}" -> "${rule.destination}" -> "${redirectBySource.get(destPath)!.destination}".`,
      );
    } else if (destNoSlash !== sourceNoSlash && redirectBySource.has(destNoSlash)) {
      errors.push(
        `Slash-variant redirect chain in firebase.json: "${rule.source}" -> "${rule.destination}" (matches redirect source "${destNoSlash}").`,
      );
    }

    if (!resolveDistFileForPath(distDir, destPath)) {
      errors.push(
        `Redirect destination does not exist in dist: "${rule.source}" -> "${rule.destination}".`,
      );
    }
  }

  // 3. Fail-closed sitemap index & sitemap validation
  const sitemapIndexPath = path.join(distDir, 'sitemap-index.xml');
  const sitemap0Path = path.join(distDir, 'sitemap-0.xml');

  if (!fs.existsSync(sitemapIndexPath)) {
    errors.push(`Missing sitemap index at ${sitemapIndexPath}.`);
  } else {
    const indexXml = fs.readFileSync(sitemapIndexPath, 'utf8');
    const indexLocs = extractLocs(indexXml);
    if (!indexXml.includes('<sitemapindex') || indexLocs.length === 0) {
      errors.push('sitemap-index.xml is empty or missing <sitemapindex> root.');
    }
  }

  if (!fs.existsSync(sitemap0Path)) {
    errors.push(`Missing sitemap at ${sitemap0Path}.`);
  } else {
    const sitemapXml = fs.readFileSync(sitemap0Path, 'utf8');
    const locs = extractLocs(sitemapXml);
    if (!sitemapXml.includes('<urlset') || locs.length < minSitemapUrls) {
      errors.push(
        `sitemap-0.xml failed closed: expected at least ${minSitemapUrls} <loc> URLs, found ${locs.length}.`,
      );
    }

    for (const loc of locs) {
      if (!loc.startsWith(`${siteOrigin}/`)) {
        errors.push(`sitemap-0.xml contains URL outside ${siteOrigin}: "${loc}".`);
        continue;
      }
      const pathname = new URL(loc).pathname;
      if (redirectBySource.has(pathname)) {
        errors.push(
          `sitemap-0.xml lists redirecting URL "${loc}" (redirects to "${redirectBySource.get(pathname)!.destination}").`,
        );
      }
      const htmlFile = resolveDistFileForPath(distDir, pathname);
      if (!htmlFile) {
        errors.push(`sitemap-0.xml lists missing page "${loc}".`);
        continue;
      }

      const html = fs.readFileSync(htmlFile, 'utf8');
      const canonicalTag = html.match(/<link[^>]*rel=["']?canonical["']?[^>]*>/i)?.[0];
      const canonicalHref = canonicalTag?.match(/href=["']([^"']+)["']/i)?.[1] ?? null;
      if (canonicalHref !== loc) {
        errors.push(
          `Canonical mismatch on sitemap URL "${loc}": found canonical="${String(canonicalHref)}".`,
        );
      }

      const robotsTag = html.match(/<meta[^>]*name=["']?robots["']?[^>]*>/i)?.[0];
      if (robotsTag && /noindex/i.test(robotsTag)) {
        errors.push(`Sitemap URL "${loc}" contains noindex meta tag: ${robotsTag}.`);
      }
    }
  }

  // 4. Validate 404.html has noindex and no canonical link
  const notFoundPath = path.join(distDir, '404.html');
  if (!fs.existsSync(notFoundPath)) {
    errors.push(`Missing 404 page at ${notFoundPath}.`);
  } else {
    const html404 = fs.readFileSync(notFoundPath, 'utf8');
    if (/<link[^>]*rel=["']?canonical["']?[^>]*>/i.test(html404)) {
      errors.push('dist/404.html must not emit a <link rel="canonical"> tag.');
    }
    const robots404 = html404.match(/<meta[^>]*name=["']?robots["']?[^>]*>/i)?.[0];
    if (!robots404 || !/noindex/i.test(robots404)) {
      errors.push('dist/404.html must emit <meta name="robots" content="noindex">.');
    }
  }

  return errors;
}

function main() {
  const distDir = path.resolve('dist');
  const firebaseRaw = fs.readFileSync(path.resolve('firebase.json'), 'utf8');
  const firebaseJson = JSON.parse(firebaseRaw) as {
    hosting?: FirebaseHostingConfig | FirebaseHostingConfig[] | null;
  } | null;
  const hosting = Array.isArray(firebaseJson?.hosting)
    ? firebaseJson.hosting[0]
    : firebaseJson?.hosting;

  const errors = verifySeoBuild({ distDir, hosting });
  if (errors.length > 0) {
    console.error(
      [`verify-seo: Found ${errors.length} SEO/indexing build error(s):`, ...errors.map((e) => `- ${e}`)].join(
        '\n',
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.log('verify-seo: Sitemaps, canonicals, 404 meta robots, headers, and redirects passed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildCanonicalDocRedirects } from './sync-firebase-docs-redirects.js';
import { verifySeoBuild } from './verify-seo.js';

function createValidDistFixture(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'genkit-verify-seo-'));
  fs.mkdirSync(path.join(tmpDir, 'docs/js/flows'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'index.html'),
    '<!doctype html><html><head><link rel="canonical" href="https://genkit.dev/"/></head><body>Home</body></html>',
  );
  fs.writeFileSync(
    path.join(tmpDir, 'docs/js/flows/index.html'),
    '<!doctype html><html><head><link rel="canonical" href="https://genkit.dev/docs/js/flows/"/></head><body>Flows</body></html>',
  );
  fs.writeFileSync(
    path.join(tmpDir, '404.html'),
    '<!doctype html><html><head><meta name="robots" content="noindex"/></head><body>404</body></html>',
  );
  fs.writeFileSync(
    path.join(tmpDir, 'sitemap-index.xml'),
    '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://genkit.dev/sitemap-0.xml</loc></sitemap></sitemapindex>',
  );
  fs.writeFileSync(
    path.join(tmpDir, 'sitemap-0.xml'),
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://genkit.dev/</loc></url><url><loc>https://genkit.dev/docs/js/flows/</loc></url></urlset>',
  );
  return tmpDir;
}

test('verifySeoBuild passes on valid sitemap, canonicals, 404, and redirects', () => {
  const distDir = createValidDistFixture();
  try {
    const errors = verifySeoBuild({
      distDir,
      minSitemapUrls: 2,
      hosting: {
        headers: [
          {
            glob: '/sitemap*.xml',
            headers: [{ key: 'Content-Type', value: 'application/xml; charset=utf-8' }],
          },
        ],
        redirects: [{ source: '/docs/flows', destination: '/docs/js/flows/', type: 301 }],
      },
    });
    assert.deepEqual(errors, []);
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});

test('verifySeoBuild fails closed when sitemap shrinks below threshold', () => {
  const distDir = createValidDistFixture();
  try {
    const errors = verifySeoBuild({
      distDir,
      minSitemapUrls: 10,
      hosting: {},
    });
    assert.ok(errors.some((e) => e.includes('sitemap-0.xml failed closed')));
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});

test('verifySeoBuild catches redirect chains, broken targets, canonical mismatches, and wildcard XML headers', () => {
  const distDir = createValidDistFixture();
  try {
    fs.writeFileSync(
      path.join(distDir, 'docs/js/flows/index.html'),
      '<!doctype html><html><head><link rel="canonical" href="https://genkit.dev/docs/flows/"/><meta name="robots" content="noindex"/></head><body>Flows</body></html>',
    );
    const errors = verifySeoBuild({
      distDir,
      minSitemapUrls: 2,
      hosting: {
        headers: [
          {
            glob: '/**/*.xml',
            headers: [{ key: 'Content-Type', value: 'application/xml' }],
          },
        ],
        redirects: [
          { source: '/docs/firebase', destination: '/docs/deployment/firebase/', type: 301 },
          { source: '/docs/deployment/firebase/', destination: '/docs/js/flows/', type: 301 },
          { source: '/docs/old', destination: '/docs/missing/', type: 301 },
        ],
      },
    });
    assert.ok(errors.some((e) => e.includes('overly broad "/**/*.xml"')));
    assert.ok(errors.some((e) => e.includes('Multi-hop redirect chain')));
    assert.ok(errors.some((e) => e.includes('Redirect destination does not exist')));
    assert.ok(errors.some((e) => e.includes('Canonical mismatch')));
    assert.ok(errors.some((e) => e.includes('contains noindex')));
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});

test('buildCanonicalDocRedirects emits neutral, unsupported-language, and agnostic redirects', () => {
  const rules = buildCanonicalDocRedirects({
    '/docs/develop-with-ai': {
      supportedLanguages: ['js', 'go', 'python'],
      isLanguageAgnostic: false,
    },
    '/docs/roadmap': {
      supportedLanguages: ['js', 'go', 'dart', 'python'],
      isLanguageAgnostic: true,
    },
  });
  const bySource = new Map(rules.map((r) => [r.source, r.destination]));
  assert.equal(bySource.get('/docs/develop-with-ai'), '/docs/js/develop-with-ai/');
  assert.equal(bySource.get('/docs/develop-with-ai/'), '/docs/js/develop-with-ai/');
  assert.equal(bySource.get('/docs/dart/develop-with-ai/'), '/docs/js/develop-with-ai/');
  assert.equal(bySource.get('/docs/go/develop-with-ai/'), undefined);
  assert.equal(bySource.get('/docs/go/roadmap/'), '/docs/roadmap/');
  assert.equal(bySource.get('/docs/roadmap/'), undefined);
});

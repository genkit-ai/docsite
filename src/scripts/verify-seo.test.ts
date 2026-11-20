import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { type FirebaseHostingConfig, verifySeoBuild } from './verify-seo.js';

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

test('verifySeoBuild fails closed without throwing when hosting config is missing or malformed', () => {
  const distDir = createValidDistFixture();
  try {
    for (const malformedHosting of [
      undefined,
      null,
      [] as unknown as FirebaseHostingConfig,
      'invalid' as unknown as FirebaseHostingConfig,
    ]) {
      const errors = verifySeoBuild({
        distDir,
        minSitemapUrls: 2,
        hosting: malformedHosting,
      });
      assert.deepEqual(errors, ['firebase.json is missing a valid "hosting" configuration.']);
    }
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

test('verifySeoBuild catches 404 canonicals, missing 404 noindex, redirecting sitemap URLs, loops, and broad noindex headers', () => {
  const distDir = createValidDistFixture();
  try {
    fs.writeFileSync(
      path.join(distDir, '404.html'),
      '<!doctype html><html><head><link rel="canonical" href="https://genkit.dev/404/"/></head><body>404</body></html>',
    );
    const errors = verifySeoBuild({
      distDir,
      minSitemapUrls: 2,
      hosting: {
        headers: [
          {
            glob: '/**',
            headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
          },
        ],
        redirects: [
          { source: '/docs/js/flows/', destination: '/docs/flows/', type: 301 },
          { source: '/docs/loop/', destination: '/docs/loop/', type: 301 },
          { source: '/docs/dup', destination: '/docs/js/flows/', type: 301 },
          { source: '/docs/dup', destination: '/', type: 301 },
        ],
      },
    });
    assert.ok(errors.some((e) => e.includes('dist/404.html must not emit a <link rel="canonical">')));
    assert.ok(errors.some((e) => e.includes('dist/404.html must emit <meta name="robots" content="noindex">')));
    assert.ok(errors.some((e) => e.includes('sitemap-0.xml lists redirecting URL')));
    assert.ok(errors.some((e) => e.includes('Redirect loop in firebase.json')));
    assert.ok(errors.some((e) => e.includes('Duplicate redirect source in firebase.json')));
    assert.ok(errors.some((e) => e.includes('must not apply X-Robots-Tag: noindex to "/**"')));
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});

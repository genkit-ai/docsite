// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidatorPlugin from 'starlight-links-validator';
import starlightBlog from 'starlight-blog';
import sitemap from '@astrojs/sitemap';
import { sidebar, docsLanguageAgnosticBySlug } from './src/sidebar.ts';
import { GOOGLE_DARK_THEME, GOOGLE_LIGHT_THEME } from './src/google-theme';

const site = 'https://genkit.dev';
const ogUrl = new URL('ogimage.png?v=1', site).href;

// https://astro.build/config
export default defineConfig({
  // TODO: Update to genkit.dev before launch
  site,
  markdown: {
    shikiConfig: {
      langAlias: {
        dotprompt: 'handlebars',
        angular: 'html',
      },
    },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Google Sans',
      cssVariable: '--font-google-sans',
      weights: [300, 400, 500],
      styles: ['normal'],
      fallbacks: ['Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Google Sans Flex',
      cssVariable: '--font-google-sans-text',
      weights: [400, 500],
      styles: ['normal'],
      fallbacks: ['Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Google Sans Code',
      cssVariable: '--font-google-sans-mono',
      weights: [400, 500],
      styles: ['normal'],
      fallbacks: ['monospace'],
    },
  ],
  integrations: [
    starlight({
      favicon: 'favicon.ico',
      expressiveCode: {
        themes: [GOOGLE_DARK_THEME, GOOGLE_LIGHT_THEME],
        tabWidth: 4,
      },
      pagination: false,
      title: 'Genkit',
      components: {
        Sidebar: './src/components/sidebar.astro',
        Header: './src/components/Header.astro',
        Hero: './src/content/custom/hero.astro',
        Head: './src/content/custom/head.astro',
        PageTitle: './src/components/PageTitle.astro',
        TableOfContents: './src/components/LanguageAwareTableOfContents.astro',
      },
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: ogUrl,
            width: '1085',
            height: '377',
          },
        },
      ],
      plugins: [
        starlightBlog({
          title: 'Blog',
          // The "Blog" link is rendered by our shared header (src/components/Header.astro).
          navigation: 'none',
          prefix: 'blog',
          metrics: { readingTime: true },
          // Global authors, referenceable by key from a post's `authors` frontmatter.
          authors: {
            genkit: {
              name: 'The Genkit Team',
              title: 'Genkit',
              url: 'https://genkit.dev',
            },
          },
        }),
        starlightLinksValidatorPlugin({
          // The landing page at `/` is a custom Astro page outside Starlight routes.
          exclude: ['/'],
        }),
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/genkit-ai/genkit',
        },
        {
          icon: 'discord',
          label: 'Discord',
          href: 'https://discord.gg/qXt5zzQKpc',
        },
        {
          icon: 'x.com',
          label: 'X',
          href: 'https://x.com/GenkitFramework',
        },
        {
          icon: 'linkedin',
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/company/genkit',
        },
        {
          icon: 'reddit',
          label: 'Reddit',
          href: 'https://reddit.com/r/GenkitFramework',
        },
      ],
      sidebar,
      customCss: ['./src/styles/tailwind.css'],
      editLink: {
        baseUrl: 'https://github.com/genkit-ai/docsite/edit/main/',
      },
    }),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '');
        // Always include language-prefixed docs and non-docs pages (homepage, etc.)
        if (/^\/docs\/(js|go|dart|python)(\/|$)/.test(pathname)) return true;
        if (!pathname.startsWith('/docs/')) return true;
        // Language-neutral docs paths: only include if explicitly marked isLanguageAgnostic in frontmatter
        const slug = pathname.replace(/^\//, ''); // e.g. 'docs/flows'
        return docsLanguageAgnosticBySlug[slug] === true;
      },
    }),
  ],
});

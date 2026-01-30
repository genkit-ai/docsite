// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidatorPlugin from 'starlight-links-validator';
import sitemap from '@astrojs/sitemap';
import { sidebar } from './src/sidebar.ts';
import { GOOGLE_DARK_THEME, GOOGLE_LIGHT_THEME } from './src/google-theme';

const site = 'https://genkit.dev';
const ogUrl = new URL('ogimage.png?v=1', site).href;

// https://astro.build/config
export default defineConfig({
  // TODO: Update to genkit.dev before launch
  site,
  markdown: {
    shikiConfig: {
      langAlias: { dotprompt: 'handlebars' },
    },
  },
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
        Header: './src/content/custom/header.astro',
        Hero: './src/content/custom/hero.astro',
        Head: './src/content/custom/head.astro',
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
        {
          tag: 'link',
          attrs: {
            href: 'https://fonts.gstatic.com',
            rel: 'preconnect',
            crossorigin: true,
          },
        },
        {
          tag: 'link',
          attrs: {
            href: 'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500&display=swap',
            rel: 'stylesheet',
          },
        },
        {
          tag: 'link',
          attrs: {
            href: 'https://fonts.googleapis.com/css2?family=Google+Sans+Text:wght@400;500&display=swap',
            rel: 'stylesheet',
          },
        },
        {
          tag: 'link',
          attrs: {
            href: 'https://fonts.googleapis.com/css2?family=Google+Sans+Mono:wght@400;500&display=swap',
            rel: 'stylesheet',
          },
        },
        {
          tag: 'link',
          attrs: {
            href: 'https://fonts.googleapis.com/css2?family=Google+Symbols&display=block',
            rel: 'stylesheet',
          },
        },
      ],
      plugins: [starlightLinksValidatorPlugin()],
      logo: {
        dark: './src/assets/lockup_white_tight2.png',
        light: './src/assets/lockup_dark_tight.png',
        replacesTitle: true,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/firebase/genkit',
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
      ],
      sidebar,
      customCss: ['./src/tailwind.css'],
      editLink: {
        baseUrl: 'https://github.com/genkit-ai/docsite/edit/main/',
      },
    }),
    sitemap(),
  ],
});

// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidatorPlugin from "starlight-links-validator";
import starlightBlog from "starlight-blog";
import sitemap from "@astrojs/sitemap";
import { sidebar, docsLanguageAgnosticBySlug } from "./src/sidebar.ts";
import { GOOGLE_DARK_THEME, GOOGLE_LIGHT_THEME } from "./src/google-theme";

import { readFileSync } from 'node:fs';

const site = 'https://genkit.dev';
const ogUrl = new URL('ogimage.png?v=1', site).href;

const authorsRaw = JSON.parse(readFileSync('./src/data/authors.json', 'utf8'));
const blogAuthors = Object.fromEntries(
  Object.entries(authorsRaw).map(([key, author]) => [
    key,
    {
      name: author.name,
      title: author.title,
    }
  ])
);

// https://astro.build/config
export default defineConfig({
  // TODO: Update to genkit.dev before launch
  site,
  markdown: {
    shikiConfig: {
      langAlias: {
        dotprompt: "handlebars",
        angular: "html",
      },
    },
  },
  // Fonts are self-hosted (local provider) rather than fetched from Google at
  // build time. The preview build runs in a sandboxed CI environment with no
  // network egress to fonts.googleapis.com, so a remote provider fails the
  // build. The woff2 files in src/assets/fonts are the variable "latin" subsets
  // Google serves for these families; weight ranges match each font's wght axis.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Google Sans",
      cssVariable: "--font-google-sans",
      fallbacks: ["Arial", "sans-serif"],
      options: {
        variants: [
          {
            weight: "400 700",
            style: "normal",
            src: ["./src/assets/fonts/google-sans.woff2"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Google Sans Flex",
      cssVariable: "--font-google-sans-text",
      fallbacks: ["Arial", "sans-serif"],
      options: {
        variants: [
          {
            weight: "100 900",
            style: "normal",
            src: ["./src/assets/fonts/google-sans-flex.woff2"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-mono",
      fallbacks: ["monospace"],
      options: {
        variants: [
          {
            weight: "300 800",
            style: "normal",
            src: ["./src/assets/fonts/google-sans-code.woff2"],
          },
        ],
      },
    },
  ],
  integrations: [
    starlight({
      favicon: "favicon.ico",
      expressiveCode: {
        themes: [GOOGLE_DARK_THEME, GOOGLE_LIGHT_THEME],
        tabWidth: 4,
      },
      pagination: false,
      title: "Genkit",
      components: {
        Sidebar: "./src/components/sidebar.astro",
        Header: "./src/components/Header.astro",
        Hero: "./src/content/custom/hero.astro",
        Head: "./src/content/custom/head.astro",
        Footer: "./src/content/custom/footer.astro",
        PageTitle: "./src/components/PageTitle.astro",
        TableOfContents: "./src/components/LanguageAwareTableOfContents.astro",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: ogUrl,
            width: "1085",
            height: "377",
          },
        },
      ],
      plugins: [
        starlightBlog({
          title: "Blog",
          // The "Blog" link is rendered by our shared header (src/components/Header.astro).
          navigation: "none",
          prefix: "blog",
          metrics: { readingTime: true },
          authors: blogAuthors,
        }),
        starlightLinksValidatorPlugin({
          // The landing page at `/` is a custom Astro page outside Starlight routes.
          exclude: ["/"],
        }),
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/genkit-ai/genkit",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/qXt5zzQKpc",
        },
        {
          icon: "x.com",
          label: "X",
          href: "https://x.com/GenkitFramework",
        },
        {
          icon: "linkedin",
          label: "LinkedIn",
          href: "https://www.linkedin.com/company/genkit",
        },
        {
          icon: "reddit",
          label: "Reddit",
          href: "https://reddit.com/r/GenkitFramework",
        },
      ],
      sidebar,
      customCss: ["./src/styles/tailwind.css"],
      editLink: {
        baseUrl: "https://github.com/genkit-ai/docsite/edit/main/",
      },
    }),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, "");
        // Always include language-prefixed docs and non-docs pages (homepage, etc.)
        if (/^\/docs\/(js|go|dart|python)(\/|$)/.test(pathname)) return true;
        if (!pathname.startsWith("/docs/")) return true;
        // Language-neutral docs paths: only include if explicitly marked isLanguageAgnostic in frontmatter
        const slug = pathname.replace(/^\//, ""); // e.g. 'docs/flows'
        return docsLanguageAgnosticBySlug[slug] === true;
      },
    }),
  ],
});

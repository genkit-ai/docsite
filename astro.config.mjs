// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidatorPlugin from "starlight-links-validator";
import starlightLlmsTxt from "starlight-llms-txt";
import sitemap from "@astrojs/sitemap";
import { sidebar } from "./src/sidebar";
import { GOOGLE_DARK_THEME, GOOGLE_LIGHT_THEME } from "./src/google-theme";

const site = "https://genkit.dev";
const ogUrl = new URL("ogimage.png?v=1", site).href;

// https://astro.build/config
export default defineConfig({
  // TODO: Update to genkit.dev before launch
  site,
  markdown: {
    shikiConfig: {
      langAlias: { dotprompt: "handlebars" },
    },
  },
  integrations: [
    starlight({
      favicon: "favicon.ico",
      expressiveCode: {
        themes: [GOOGLE_DARK_THEME, GOOGLE_LIGHT_THEME],
      },
      pagination: false,
      title: "Genkit",
      components: {
        Sidebar: "./src/components/sidebar.astro",
        Header: "./src/content/custom/header.astro",
        Hero: "./src/content/custom/hero.astro",
        Head: './src/content/custom/head.astro',
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
        {
          tag: "link",
          attrs: {
            href: "https://fonts.gstatic.com",
            rel: "preconnect",
            crossorigin: true,
          },
        },
        {
          tag: "link",
          attrs: {
            href: "https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500&display=swap",
            rel: "stylesheet",
          },
        },
        {
          tag: "link",
          attrs: {
            href: "https://fonts.googleapis.com/css2?family=Google+Sans+Text:wght@400;500&display=swap",
            rel: "stylesheet",
          },
        },
        {
          tag: "link",
          attrs: {
            href: "https://fonts.googleapis.com/css2?family=Google+Sans+Mono:wght@400;500&display=swap",
            rel: "stylesheet",
          },
        },
        {
          tag: "link",
          attrs: {
            href: "https://fonts.googleapis.com/css2?family=Google+Symbols&display=block",
            rel: "stylesheet",
          },
        },
      ],
      plugins: [
        starlightLinksValidatorPlugin(),
        starlightLlmsTxt({
          projectName: "Genkit",
          description: "Open-source GenAI toolkit for JS, Go, and Python.",
          minify: { whitespace: false },
          customSets: [
            {
              label: "Building AI Workflows",
              description:
                "Guidance on how to generate content and interact with LLM and image models using Genkit.",
              paths: [
                "unified-docs/get-started",
                "unified-docs/generating-content",
                "unified-docs/context",
                "unified-docs/creating-flows",
                "unified-docs/dotprompt",
                "unified-docs/chat-sessions",
                "unified-docs/tool-calling",
                "unified-docs/model-context-protocol",
                "unified-docs/interrupts",
                "unified-docs/rag",
                "unified-docs/multi-agent-systems",
                "unified-docs/error-handling",
                "unified-docs/evaluation",
              ],
            },
            {
              label: "Deploying AI Workflows",
              description:
                "Guidance on how to deploy Genkit code to various environments including Firebase and Cloud Run or use within a Next.js app.",
              paths: [
                "unified-docs/deployment",
                "unified-docs/deployment/firebase",
                "unified-docs/deployment/cloud-run",
                "unified-docs/deployment/any-platform",
                "unified-docs/deployment/authorization",
                "unified-docs/frameworks/express",
                "unified-docs/frameworks/nextjs",
              ],
            },
            {
              label: "Observing AI Workflows",
              description:
                "Guidance about Genkit's various observability features and how to use them.",
              paths: [
                "unified-docs/observability/overview",
                "unified-docs/observability-monitoring",
                "unified-docs/observability/authentication",
                "unified-docs/observability/advanced-configuration",
                "unified-docs/observability/troubleshooting",
              ],
            },
            {
              label: "Writing Plugins",
              description: "Guidance about how to author plugins for Genkit.",
              paths: [
                "unified-docs/plugin-authoring/overview",
                "unified-docs/plugin-authoring/models",
              ],
            },
            {
              label: "AI Providers",
              description:
                "Provider-specific documentation for AI model providers and integrations.",
              paths: [
                "unified-docs/plugins/google-ai",
                "unified-docs/plugins/vertex-ai",
                "unified-docs/plugins/openai",
                "unified-docs/plugins/anthropic",
                "unified-docs/plugins/xai",
                "unified-docs/plugins/deepseek",
                "unified-docs/plugins/ollama",
              ],
            },
            {
              label: "Vector Databases",
              description:
                "Documentation for vector database integrations and retrieval systems.",
              paths: [
                "unified-docs/vector-databases/dev-local-vectorstore",
                "unified-docs/vector-databases/pinecone",
                "unified-docs/vector-databases/chromadb",
                "unified-docs/vector-databases/pgvector",
                "unified-docs/vector-databases/lancedb",
                "unified-docs/vector-databases/astra-db",
                "unified-docs/vector-databases/neo4j",
                "unified-docs/vector-databases/cloud-sql-postgresql",
                "unified-docs/vector-databases/cloud-firestore",
              ],
            },
            {
              label: "Developer Tools",
              description:
                "Documentation for development tools, MCP server, and local development.",
              paths: [
                "unified-docs/developer-tools",
                "unified-docs/mcp-server",
              ],
            },
          ],
        }),
      ],
      logo: {
        dark: "./src/assets/lockup_white_tight2.png",
        light: "./src/assets/lockup_dark_tight.png",
        replacesTitle: true,
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/firebase/genkit",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/qXt5zzQKpc",
        },
      ],
      sidebar,
      customCss: ["./src/tailwind.css"],
    }),
    sitemap(),
  ],
  redirects: {
    "/discord": 'https://discord.gg/qXt5zzQKpc',
  },
});

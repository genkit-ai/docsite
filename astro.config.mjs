// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidatorPlugin from "starlight-links-validator";
import sitemap from "@astrojs/sitemap";
import { sidebar } from "./src/sidebar.ts";
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

    // Old JS Pages
    "/docs/angular/": "/docs/frameworks/angular/?lang=js",
    "/docs/auth/": "/docs/deployment/authorization/?lang=js",
    "/docs/cloud-run/": "/docs/deployment/cloud-run/?lang=js",
    "/docs/deploy-node/": "/docs/deployment/any-platform/?lang=js",
    "/docs/firebase/": "/docs/deployment/firebase/",
    "/docs/nextjs/": "/docs/frameworks/nextjs/?lang=js",
    "/docs/plugin-authoring-evaluator/": "/docs/plugin-authoring/evaluators/?lang=js",
    "/docs/plugin-authoring/": "/docs/plugin-authoring/overview/?lang=js",
    "/docs/plugins/astra-db/": "/docs/integrations/astra-db/?lang=js",
    "/docs/plugins/auth0/": "/docs/integrations/auth0/?lang=js",
    "/docs/plugins/chroma/": "/docs/integrations/chroma/?lang=js",
    "/docs/plugins/cloud-sql-pg/": "/docs/integrations/cloud-sql-postgresql/?lang=js",
    "/docs/plugins/compat-oai/": "/docs/integrations/openai-compatible/?lang=js",
    "/docs/plugins/deepseek/": "/docs/integrations/deepseek/?lang=js",
    "/docs/plugins/express/": "/docs/frameworks/express/?lang=js",
    "/docs/plugins/firebase/": "/docs/deployment/firebase/?lang=js",
    "/docs/plugins/google-ai/": "/docs/integrations/google-genai/?lang=js",
    "/docs/plugins/google-genai/": "/docs/integrations/google-genai/?lang=js",
    "/docs/plugins/lancedb/": "/docs/integrations/lancedb/?lang=js",
    "/docs/plugins/mcp/": "/docs/integrations/mcp/?lang=js",
    "/docs/plugins/neo4j/": "/docs/integrations/neo4j/?lang=js",
    "/docs/plugins/ollama/": "/docs/integrations/ollama/?lang=js",
    "/docs/plugins/openai/": "/docs/integrations/openai/?lang=js",
    "/docs/plugins/pgvector/": "/docs/integrations/pgvector/?lang=js",
    "/docs/plugins/pinecone/": "/docs/integrations/pinecone/?lang=js",
    "/docs/plugins/third-party-plugins/": "/",
    "/docs/plugins/toolbox/": "/docs/integrations/toolbox/?lang=js",
    "/docs/plugins/vertex-ai/": "/docs/integrations/google-genai/?lang=js",
    "/docs/plugins/xai/": "/docs/integrations/xai/?lang=js",
    "/docs/templates/pgvector/": "/docs/integrations/pgvector/?lang=js",
    "/docs/tutorials/tutorial-chat-with-a-pdf/": "/docs/tutorials/chat-with-pdf/?lang=js",
    "/docs/tutorials/tutorial-summarize-youtube-videos/": "/docs/tutorials/summarize-youtube-videos/?lang=js",

    // Old Go pages
    "/go/docs/cloud-run/": "/docs/deployment/cloud-run/?lang=go",
    "/go/docs/deploy/": "/docs/deployment/any-platform/?lang=go",
    "/go/docs/dotprompt/": "/docs/dotprompt/?lang=go",
    "/go/docs/evaluation/": "/docs/evaluation/?lang=go",
    "/go/docs/flows/": "/docs/flows/?lang=go",
    "/go/docs/get-started-go/": "/docs/get-started/?lang=go",
    "/go/docs/models/": "/docs/models/?lang=go",
    "/go/docs/monitoring/": "/docs/observability/getting-started/?lang=go",
    "/go/docs/plugin-authoring-models/": "/docs/plugin-authoring/overview/?lang=go",
    "/go/docs/plugin-authoring-telemetry/": "/docs/plugin-authoring/overview/?lang=go#telemetry-plugins",
    "/go/docs/plugin-authoring/": "/docs/plugin-authoring/overview/?lang=go",
    "/go/docs/plugins/alloydb/": "/docs/integrations/alloydb/?lang=go",
    "/go/docs/plugins/cloud-sql-pg/": "/docs/integrations/cloud-sql-postgresql/?lang=go",
    "/go/docs/plugins/firebase/": "/docs/deployment/firebase/?lang=go",
    "/go/docs/plugins/google-cloud/": "/docs/integrations/google-cloud/?lang=go",
    "/go/docs/plugins/google-genai/": "/docs/integrations/google-genai/?lang=go",
    "/go/docs/plugins/mcp/": "/docs/integrations/mcp/?lang=go",
    "/go/docs/plugins/ollama/": "/docs/integrations/ollama/?lang=go",
    "/go/docs/plugins/openai/": "/docs/integrations/openai/?lang=go",
    "/go/docs/plugins/pgvector/": "/docs/integrations/pgvector/?lang=go",
    "/go/docs/plugins/pinecone/": "/docs/integrations/pinecone/?lang=go",
    "/go/docs/plugins/third-party-plugins/": "/?lang=go",
    "/go/docs/plugins/toolbox/": "/docs/integrations/toolbox/?lang=go",
    "/go/docs/rag/": "/docs/rag/?lang=go",
    "/go/docs/tool-calling/": "/docs/tool-calling/?lang=go",

    // Old python pages
    "/python/docs/cloud-run/": "/docs/deployment/cloud-run/?lang=python",
    "/python/docs/flask/": "/docs/deployment/any-platform/?lang=python",
    "/python/docs/get-started/": "/docs/get-started/?lang=python",
    "/python/docs/reference/flows/": "/docs/flows/?lang=python",
    "/python/docs/reference/interrupts/": "/docs/interrupts/?lang=python",
    "/python/docs/reference/models/": "/docs/models/?lang=python",
    "/python/docs/reference/plugins/dev-local-vectorstore/": "/docs/integrations/dev-local-vectorstore/?lang=python",
    "/python/docs/reference/plugins/firestore/": "/docs/integrations/cloud-firestore/?lang=python",
    "/python/docs/reference/plugins/google-genai/": "/docs/integrations/google-genai/?lang=python",
    "/python/docs/reference/plugins/ollama/": "/docs/integrations/ollama/?lang=python",
    "/python/docs/reference/rag/": "/docs/rag/?lang=python",
    "/python/docs/reference/tools/": "/docs/tool-calling/?lang=python",
  },
});

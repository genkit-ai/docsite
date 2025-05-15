// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import starlightLinksValidatorPlugin from "starlight-links-validator";
import starlightLlmsTxt from "starlight-llms-txt";
import { sidebar } from "./src/sidebar";

// https://astro.build/config
export default defineConfig({
  // TODO: Update to genkit.dev before launch
  site: "https://genkit-dev-astro.web.app/",
  markdown: {
    shikiConfig: {
      langAlias: { dotprompt: "handlebars" },
    },
  },
  integrations: [
    starlight({
      pagination: false,
      title: "Genkit",
      components: {
        Sidebar: "./src/components/sidebar.astro",
        Header: "./src/content/custom/header.astro",
        Hero: "./src/content/custom/hero.astro",
      },
      head: [
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
                "docs/models",
                "docs/context",
                "docs/flows",
                "docs/dotprompt",
                "docs/chat",
                "docs/tool-calling",
                "docs/interrupts",
                "docs/rag",
                "docs/multi-agent",
                "docs/evaluation",
                "docs/local-observability",
                "docs/errors/types",
              ],
            },
            {
              label: "Deploying AI Workflows",
              description:
                "Guidance on how to deploy Genkit code to various environments including Firebase and Cloud Run or use within a Next.js app.",
              paths: [
                "docs/firebase",
                "docs/cloud-run",
                "docs/deploy-node",
                "docs/auth",
                "docs/nextjs",
              ],
            },
            {
              label: "Observing AI Workflows",
              description:
                "Guidance about Genkit's various observability features and how to use them.",
              paths: [
                "docs/observability/getting-started",
                "docs/observability/authentication",
                "docs/observability/advanced-configuration",
                "docs/observability/telemetry-collection",
                "docs/observability/troubleshooting",
              ],
            },
            {
              label: "Writing Plugins",
              description: "Guidance about how to author plugins for Genkit.",
              paths: [
                "docs/plugin-authoring",
                "docs/plugin-authoring-evaluator",
              ],
            },
            {
              label: "Plugin Documentation",
              description:
                "Provider-specific documentation for the Google AI, Vertex AI, Firebase, Ollama, Chroma, and Pinecone plugins.",
              paths: [
                "docs/plugins/google-genai",
                "docs/plugins/vertex-ai",
                "docs/plugins/firebase",
                "docs/plugins/ollama",
                "docs/plugins/chroma",
                "docs/plugins/pinecone",
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
      customCss: [
        "./src/tailwind.css",
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});

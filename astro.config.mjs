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
      },
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
                "guides/models",
                "guides/context",
                "guides/flows",
                "guides/dotprompt",
                "guides/chat",
                "guides/tool-calling",
                "guides/interrupts",
                "guides/rag",
                "guides/multi-agent",
                "guides/evaluation",
                "guides/local-observability",
                "guides/errors/types",
              ],
            },
            {
              label: "Deploying AI Workflows",
              description:
                "Guidance on how to deploy Genkit code to various environments including Firebase and Cloud Run or use within a Next.js app.",
              paths: [
                "guides/firebase",
                "guides/cloud-run",
                "guides/deploy-node",
                "guides/auth",
                "guides/nextjs",
              ],
            },
            {
              label: "Observing AI Workflows",
              description:
                "Guidance about Genkit's various observability features and how to use them.",
              paths: [
                "guides/observability/getting-started",
                "guides/observability/authentication",
                "guides/observability/advanced-configuration",
                "guides/observability/telemetry-collection",
                "guides/observability/troubleshooting",
              ],
            },
            {
              label: "Writing Plugins",
              description: "Guidance about how to author plugins for Genkit.",
              paths: [
                "guides/plugin-authoring",
                "guides/plugin-authoring-evaluator",
              ],
            },
            {
              label: "Plugin Documentation",
              description:
                "Provider-specific documentation for the Google AI, Vertex AI, Firebase, Ollama, Chroma, and Pinecone plugins.",
              paths: [
                "guides/plugins/google-genai",
                "guides/plugins/vertex-ai",
                "guides/plugins/firebase",
                "guides/plugins/ollama",
                "guides/plugins/chroma",
                "guides/plugins/pinecone",
              ],
            },
          ],
        }),
      ],
      logo: {
        src: "./src/assets/lockup_white_tight.png",
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
        "@fontsource/ibm-plex-sans/400.css",
        "@fontsource/ibm-plex-sans/400-italic.css",
        "@fontsource/ibm-plex-sans/600.css",
        "@fontsource/ibm-plex-sans/600-italic.css",
        "./src/fonts/font-face.css",
        "./src/tailwind.css",
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});

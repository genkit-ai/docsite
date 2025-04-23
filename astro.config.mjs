// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import starlightLinksValidatorPlugin from "starlight-links-validator";
import starlightLlmsTxt from "starlight-llms-txt";

// https://astro.build/config
export default defineConfig({
	// TODO: Update to genkit.dev before launch
	site: 'https://genkit-dev-astro.web.app/',
	markdown: {
		shikiConfig: {
			langAlias: { dotprompt: "handlebars" },
		},
	},
	integrations: [
		starlight({
			title: "Genkit",
			components: {
				Header: './src/content/custom/header.astro',
				Hero: './src/content/custom/hero.astro',
			},
			plugins: [starlightLinksValidatorPlugin(), starlightLlmsTxt({
				projectName: 'Genkit',
				description: 'Open-source GenAI toolkit for JS, Go, and Python.',
				minify: {whitespace: false},
				customSets: [
					{label: 'Building AI Workflows', description: 'Guidance on how to generate content and interact with LLM and image models using Genkit.', paths: ['guides/models', 'guides/context', 'guides/flows', 'guides/dotprompt', 'guides/chat', 'guides/tool-calling', 'guides/interrupts', 'guides/rag', 'guides/multi-agent', 'guides/evaluation', 'guides/local-observability', 'guides/errors/types']},
					{label: 'Deploying AI Workflows', description: 'Guidance on how to deploy Genkit code to various environments including Firebase and Cloud Run or use within a Next.js app.', paths: ['guides/firebase', 'guides/cloud-run', 'guides/deploy-node', 'guides/auth', 'guides/nextjs']},
					{label: 'Observing AI Workflows', description: "Guidance about Genkit's various observability features and how to use them.", paths: ['guides/observability/getting-started', 'guides/observability/authentication', 'guides/observability/advanced-configuration', 'guides/observability/telemetry-collection', 'guides/observability/troubleshooting']},
					{label: 'Writing Plugins', description: 'Guidance about how to author plugins for Genkit.', paths: ['guides/plugin-authoring', 'guides/plugin-authoring-evaluator']},
					{label: 'Plugin Documentation', description: 'Provider-specific documentation for the Google AI, Vertex AI, Firebase, Ollama, Chroma, and Pinecone plugins.', paths: ['guides/plugins/google-genai', 'guides/plugins/vertex-ai', 'guides/plugins/firebase', 'guides/plugins/ollama', 'guides/plugins/chroma', 'guides/plugins/pinecone']},
				]
			})],
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
				{
					icon: "youtube",
					label: "Youtube",
					href: "https://www.youtube.com/playlist?list=PLl-K7zZEsYLn_AieFQOD5iIrbvQj6X1ah",
				},
			],
			sidebar: [
				{
					label: "Genkit",
					items: [
						{ label: "Introduction", slug: "guides/intro" }, // Assuming index.mdx is the intro
						{ label: "Get started", slug: "guides/get-started" },
						{ label: "API Stability Channels", slug: "guides/api-stability" },
						{ label: "Developer tools", slug: "guides/devtools" },
					],
				},
				{
					label: "API reference",
					items: [
						{
							label: "Genkit JS API reference",
							link: "https://js.api.genkit.dev/",
						},
					],
				},
				/* {
					label: "Codelabs",
					items: [
						// { label: "Chat with a PDF file", link: "#TODO" }, // Codelab content not migrated
					],
				}, */
				{
					label: "Building AI workflows",
					items: [
						{ label: "Generating content", slug: "guides/models" },
						{
							label: "Passing information through context",
							slug: "guides/context",
						},
						{ label: "Creating flows", slug: "guides/flows" },
						{
							label: "Managing prompts with Dotprompt",
							slug: "guides/dotprompt",
						},
						{ label: "Persistent chat sessions", slug: "guides/chat" },
						{
							label: "Tools",
							items: [
								{ label: "Tool calling", slug: "guides/tool-calling" },
								{
									label: "Pause generation using interrupts",
									slug: "guides/interrupts",
								},
							],
						},
						{
							label: "Retrieval-augmented generation (RAG)",
							slug: "guides/rag",
						},
						{ label: "Multi-agent systems", slug: "guides/multi-agent" },
						{ label: "Evaluation", slug: "guides/evaluation" },
						{
							label: "Observe local metrics",
							slug: "guides/local-observability",
						},
						{ label: "Error Types", slug: "guides/errors/types" },
					],
				},
				{
					label: "Deploying AI workflows",
					items: [
						{ label: "Deploy with Firebase", slug: "guides/firebase" },
						{ label: "Deploy with Cloud Run", slug: "guides/cloud-run" },
						{
							label: "Deploy to any Node.js platform",
							slug: "guides/deploy-node",
						},
						{ label: "Authorization and integrity", slug: "guides/auth" },
					],
				},
				{
					label: "Observing AI workflows",
					items: [
						{
							label: "Getting Started",
							slug: "guides/observability/getting-started",
						},
						{
							label: "Authentication",
							slug: "guides/observability/authentication",
						},
						{
							label: "Advanced Configuration",
							slug: "guides/observability/advanced-configuration",
						},
						{
							label: "Telemetry Collection",
							slug: "guides/observability/telemetry-collection",
						},
						{
							label: "Troubleshooting",
							slug: "guides/observability/troubleshooting",
						},
					],
				},
				{
					label: "Writing plugins",
					items: [
						// NOTE: Deployment links were incorrectly placed here before, removed them.
						{ label: "Overview", slug: "guides/plugin-authoring" },
						{
							label: "Writing an Evaluator Plugin",
							slug: "guides/plugin-authoring-evaluator",
						},
					],
				},
				{
					label: "Plugins",
					items: [
						{ label: "Google AI", slug: "guides/plugins/google-genai" },
						{ label: "Vertex AI", slug: "guides/plugins/vertex-ai" },
						{ label: "Firebase", slug: "guides/plugins/firebase" },
						{ label: "Ollama", slug: "guides/plugins/ollama" },
						{ label: "Chroma", slug: "guides/plugins/chroma" },
						{ label: "Pinecone", slug: "guides/plugins/pinecone" },
						// { label: "Partner & 3P Plugins", link: "#TODO" },
					],
				},
				{
					label: "Templates",
					items: [
						{ label: "pgvector Retriever", slug: "guides/templates/pgvector" },
					],
				},
				{
					label: "Framework Integrations",
					items: [
						{ label: "Using Genkit with Next.js", slug: "guides/nextjs" },
					],
				},
				{
					label: "Migration Guides",
					items: [
						// Added 0.9->1.0 link to main Genkit section previously
						{
							label: "Migrate from 0.5 to 0.9",
							slug: "guides/migrating-from-0.5",
						},
					],
				},
				{
					label: "Community",
					items: [{ label: "Connect with us", slug: "guides/feedback" }],
				},
				// Keeping Reference section if it's still needed, otherwise remove
				// {
				// 	label: "Reference",
				// 	autogenerate: { directory: "reference" },
				// },
			],
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

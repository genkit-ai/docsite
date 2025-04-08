// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "Genkit",
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
			],
			sidebar: [
				{
					label: "Genkit",
					items: [
						{ label: "Introduction", slug: "index" }, // Assuming index.mdx is the intro
						{ label: "Get started", slug: "guides/get-started" },
						{
							label: "Migrate from Genkit 0.9 to 1.0",
							slug: "guides/migrating-from-0.9",
						},
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
						// { label: "Error Types", link: "#TODO" }, // Error types content not migrated
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
				/* {
					label: "Observing AI workflows",
					items: [
						// { label: "Getting Started", link: "#TODO" }, // Observability content not migrated
						// { label: "Authentication", link: "#TODO" },
						// { label: "Advanced Configuration", link: "#TODO" },
						// { label: "Telemetry Collection", link: "#TODO" },
						// { label: "Troubleshooting", link: "#TODO" },
					],
				}, */
				{
					label: "Writing plugins",
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
						// { label: "Getting Started", link: "#TODO" }, // Observability content not migrated
						// { label: "Authentication", link: "#TODO" },
						// { label: "Advanced Configuration", link: "#TODO" },
						// { label: "Telemetry Collection", link: "#TODO" },
						// { label: "Troubleshooting", link: "#TODO" },
					],
				},
				{
					label: "Writing plugins",
					items: [
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
						// { label: "Google AI for Developers", link: "#TODO" }, // Specific plugin pages not migrated
						// { label: "Google Cloud Vertex AI", link: "#TODO" },
						{ label: "Firebase", slug: "guides/firebase" }, // Re-link to firebase deploy page
						// { label: "Partner & 3P Plugins", link: "#TODO" },
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
						{
							label: "Migrate from Genkit 0.5 to 0.9",
							slug: "guides/migrating-from-0.5",
						},
						// Note: 0.9 to 1.0 migration is under 'Genkit' section
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

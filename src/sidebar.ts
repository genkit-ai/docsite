const JS_SIDEBAR = [
  { label: "Get started", slug: "guides/get-started" },
  { label: "API Stability Channels", slug: "guides/api-stability" },
  {
    label: "API reference",
    link: "https://js.api.genkit.dev/",
    icon: "external",
  },
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
      {
        label: "pgvector Retriever",
        slug: "guides/templates/pgvector",
      },
    ],
  },
  {
    label: "Framework Integrations",
    items: [{ label: "Using Genkit with Next.js", slug: "guides/nextjs" }],
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
  // }
];

const GO_SIDEBAR = [{ label: "Get Started", slug: "go/guides/get-started" }];
const PYTHON_SIDEBAR = [
  { label: "Get Started", slug: "python/guides/get-started" },
];

export const sidebar = [
  { label: "Developer tools", slug: "guides/devtools" },
  {
    label: "Genkit JS",
    items: JS_SIDEBAR,
    collapsed: true,
  },
  {
    label: "Genkit Go",
    items: GO_SIDEBAR,
    collapsed: true,
  },
  {
    label: "Genkit Python",
    items: PYTHON_SIDEBAR,
    collapsed: true,
  },
];

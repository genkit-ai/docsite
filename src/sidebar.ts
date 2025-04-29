const JS_SIDEBAR = [
  { label: "Get started", slug: "docs/get-started" },
  { label: "API Stability Channels", slug: "docs/api-stability" },
  {
    label: "API reference",
    link: "https://js.api.genkit.dev/",
    attrs: { "data-external": true },
  },
  {
    label: "Building AI workflows",
    items: [
      { label: "Generating content", slug: "docs/models" },
      {
        label: "Passing information through context",
        slug: "docs/context",
      },
      { label: "Creating flows", slug: "docs/flows" },
      {
        label: "Managing prompts with Dotprompt",
        slug: "docs/dotprompt",
      },
      { label: "Persistent chat sessions", slug: "docs/chat" },
      {
        label: "Tools",
        items: [
          { label: "Tool calling", slug: "docs/tool-calling" },
          {
            label: "Pause generation using interrupts",
            slug: "docs/interrupts",
          },
        ],
      },
      {
        label: "Retrieval-augmented generation (RAG)",
        slug: "docs/rag",
      },
      { label: "Multi-agent systems", slug: "docs/multi-agent" },
      { label: "Evaluation", slug: "docs/evaluation" },
      {
        label: "Observe local metrics",
        slug: "docs/local-observability",
      },
      { label: "Error Types", slug: "docs/errors/types" },
    ],
  },
  {
    label: "Deploying AI workflows",
    items: [
      { label: "Deploy with Firebase", slug: "docs/firebase" },
      { label: "Deploy with Cloud Run", slug: "docs/cloud-run" },
      {
        label: "Deploy to any Node.js platform",
        slug: "docs/deploy-node",
      },
      { label: "Authorization and integrity", slug: "docs/auth" },
    ],
  },
  {
    label: "Observing AI workflows",
    items: [
      {
        label: "Getting Started",
        slug: "docs/observability/getting-started",
      },
      {
        label: "Authentication",
        slug: "docs/observability/authentication",
      },
      {
        label: "Advanced Configuration",
        slug: "docs/observability/advanced-configuration",
      },
      {
        label: "Telemetry Collection",
        slug: "docs/observability/telemetry-collection",
      },
      {
        label: "Troubleshooting",
        slug: "docs/observability/troubleshooting",
      },
    ],
  },
  {
    label: "Writing plugins",
    items: [
      // NOTE: Deployment links were incorrectly placed here before, removed them.
      { label: "Overview", slug: "docs/plugin-authoring" },
      {
        label: "Writing an Evaluator Plugin",
        slug: "docs/plugin-authoring-evaluator",
      },
    ],
  },
  {
    label: "Plugins",
    items: [
      { label: "Google AI", slug: "docs/plugins/google-genai" },
      { label: "Vertex AI", slug: "docs/plugins/vertex-ai" },
      { label: "Firebase", slug: "docs/plugins/firebase" },
      { label: "Ollama", slug: "docs/plugins/ollama" },
      { label: "Chroma", slug: "docs/plugins/chroma" },
      { label: "Pinecone", slug: "docs/plugins/pinecone" },
      // { label: "Partner & 3P Plugins", link: "#TODO" },
    ],
  },
  {
    label: "Templates",
    items: [
      {
        label: "pgvector Retriever",
        slug: "docs/templates/pgvector",
      },
    ],
  },
  {
    label: "Framework Integrations",
    items: [{ label: "Using Genkit with Next.js", slug: "docs/nextjs" }],
  },
  {
    label: "Migration Guides",
    items: [
      // Added 0.9->1.0 link to main Genkit section previously
      {
        label: "Migrate from 0.5 to 0.9",
        slug: "docs/migrating-from-0.5",
      },
    ],
  },
  {
    label: "Community",
    items: [{ label: "Connect with us", slug: "docs/feedback" }],
  },
  // Keeping Reference section if it's still needed, otherwise remove
  // {
  // 	label: "Reference",
  // 	autogenerate: { directory: "reference" },
  // }
];

const GO_SIDEBAR = [{ label: "Get Started", slug: "go/docs/get-started" }];
const PYTHON_SIDEBAR = [
  { label: "Get Started", slug: "python/docs/get-started" },
];

export const sidebar = [
  { label: "Developer tools", slug: "docs/devtools" },
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

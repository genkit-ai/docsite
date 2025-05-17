const JS_SIDEBAR = [
  { label: "Get started", slug: "docs/get-started" },
  { label: "Developer tools", slug: "docs/devtools" },
  {
    label: "Tutorials",
    items: [
      {
        label: "Chat with a PDF",
        slug: "docs/tutorials/tutorial-chat-with-a-pdf",
      },
      {
        label: "Summarize YouTube videos",
        slug: "docs/tutorials/tutorial-summarize-youtube-videos",
      },
      {
        label: "Agentic barista Angular app",
        link: "https://developers.google.com/solutions/learn/agentic-barista",
        attrs: {
          "data-external": true,
          target: "_blank",
          class: "external-icon",
          rel: "noopener",
        },
      },
    ],
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
      { label: "Tool calling", slug: "docs/tool-calling" },
      {
        label: "Pause generation using interrupts",
        slug: "docs/interrupts",
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
    label: "Plugins",
    items: [
      { label: "Google AI", slug: "docs/plugins/google-genai" },
      { label: "Vertex AI", slug: "docs/plugins/vertex-ai" },
      { label: "Firebase", slug: "docs/plugins/firebase" },
      {
        label: "Partner & 3P Plugins",
        items: [
          { label: "Overview", slug: "docs/plugins/third-party-plugins" },
          { label: "Pinecone", slug: "docs/plugins/pinecone" },
          { label: "ChromaDB", slug: "docs/plugins/chroma" },
          { label: "Ollama", slug: "docs/plugins/ollama" },
          { label: "pgvector", slug: "docs/plugins/pgvector" },
        ],
      },
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
    items: [
      { label: "Using Genkit with Next.js", slug: "docs/nextjs" },
      { label: "Using Genkit with Angular", slug: "docs/angular" },
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
  // {
  //   label: "Migration Guides",
  //   items: [
  //     // Added 0.9->1.0 link to main Genkit section previously
  //     {
  //       label: "Migrate from 0.5 to 0.9",
  //       slug: "docs/migrating-from-0.5",
  //     },
  //   ],
  // },
  {
    label: "Community",
    items: [{ label: "Connect with us", slug: "docs/feedback" }],
  },
  {
    label: "Reference",
    items: [
      {
        label: "API reference",
        link: "https://js.api.genkit.dev/",
        attrs: {
          "data-external": true,
          target: "_blank",
          class: "external-icon",
          rel: "noopener",
          // style: "font-weight: 600; font-size: var(--sl-text-base); color: var(--sl-color-white);",
        },
      },
      { label: "API stability channels", slug: "docs/api-stability" },
    ],
  },
];

const GO_SIDEBAR = [
  { label: "Get started", slug: "go/docs/get-started-go" },
  {
    label: "Building AI workflows",
    items: [
      { label: "Generating content", slug: "go/docs/models" },
      { label: "Creating flows", slug: "go/docs/flows" },
      { label: "Managing prompts with Dotprompt", slug: "go/docs/dotprompt" },
      { label: "Tool calling", slug: "go/docs/tool-calling" },
      { label: "Retrieval-augmented generation (RAG)", slug: "go/docs/rag" },
      { label: "Evaluation", slug: "go/docs/evaluation" },
      { label: "Observability & monitoring", slug: "go/docs/monitoring" },
    ],
  },
  {
    label: "Deploying AI workflows",
    items: [
      { label: "Deploy with Cloud Run", slug: "go/docs/cloud-run" },
      { label: "Deploy with any hosting service", slug: "go/docs/deploy" },
    ],
  },
  {
    label: "Writing plugins",
    items: [
      { label: "Overview", slug: "go/docs/plugin-authoring" },
      {
        label: "Writing a model plugin",
        slug: "go/docs/plugin-authoring-models",
      },
      {
        label: "Writing a telemetry plugin",
        slug: "go/docs/plugin-authoring-telemetry",
      },
    ],
  },
  {
    label: "Plugins",
    items: [
      { label: "Google Generative AI", slug: "go/docs/plugins/google-genai" },
      { label: "Google Cloud", slug: "go/docs/plugins/google-cloud" },
      {
        label: "Partner & 3P Plugins",
        items: [
          { label: "Overview", slug: "go/docs/plugins/third-party-plugins" },
          { label: "Ollama", slug: "go/docs/plugins/ollama" },
          { label: "pgvector", slug: "go/docs/plugins/pgvector" },
          { label: "Pinecone", slug: "go/docs/plugins/pinecone" },
        ],
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        label: "API Reference",
        link: "https://pkg.go.dev/github.com/firebase/genkit/go",
        attrs: {
          "data-external": true,
          target: "_blank",
          class: "external-icon",
          rel: "noopener",
        },
      },
    ],
  },
];
const PYTHON_SIDEBAR = [
  { label: "Get started", slug: "python/docs/get-started" },
  { label: "Deploy with Cloud Run", slug: "python/docs/cloud-run" },
  { label: "Deploy with Flask", slug: "python/docs/flask" },
  {
    label: "Generating content with AI models",
    slug: "python/docs/reference/models",
  },
  { label: "Defining AI workflows", slug: "python/docs/reference/flows" },
  { label: "Tool (function) calling", slug: "python/docs/reference/tools" },
  { label: "Tool interrupts", slug: "python/docs/reference/interrupts" },
  {
    label: "Retrieval-augmented generation (RAG)",
    slug: "python/docs/reference/rag",
  },
  {
    label: "Plugins",
    items: [
      {
        label: "Google GenAI",
        slug: "python/docs/reference/plugins/google-genai",
      },
      {
        label: "Firestore Vector Store",
        slug: "python/docs/reference/plugins/firestore",
      },
      { label: "Ollama", slug: "python/docs/reference/plugins/ollama" },
      {
        label: "Dev Local Vector Store",
        slug: "python/docs/reference/plugins/dev-local-vectorstore",
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        label: "API Reference",
        link: "https://python.api.genkit.dev/reference/api/",
        attrs: {
          "data-external": true,
          target: "_blank",
          class: "external-icon",
          rel: "noopener",
        },
      },
    ],
  },
];

export const sidebar = [
  { label: "Introduction", slug: "" },
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

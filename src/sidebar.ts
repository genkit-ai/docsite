const DOCS_SIDEBAR = [
  {
    label: "Get started",
    items: [
      { label: "Get started", slug: "docs/get-started", attrs: { 'data-lang': 'js go python' } },
      { label: "Developer tools", slug: "docs/devtools", attrs: { 'data-lang': 'js go python' } },
    ],
  },
    {
    label: "Build with AI",
    items: [
      { label: "Genkit MCP Server", slug: "docs/mcp-server", attrs: { 'data-lang': 'js go python' } },
      { label: "AI-Assisted Development", slug: "docs/develop-with-ai", attrs: { 'data-lang': 'js go python' } },
    ],
  },
  {
    label: "Building AI workflows",
    items: [
      { label: "Generating content", slug: "docs/models", attrs: { 'data-lang': 'js go python' } },
      { label: "Passing information through context", slug: "docs/context", attrs: { 'data-lang': 'js' } },
      { label: "Creating flows", slug: "docs/flows", attrs: { 'data-lang': 'js go python' } },
      { label: "Implementing Agentic Patterns", slug: "docs/agentic-patterns", attrs: { 'data-lang': 'js go' } },
      { label: "Managing prompts with Dotprompt", slug: "docs/dotprompt", attrs: { 'data-lang': 'js go' } },
      { label: "Creating persistent chat sessions", slug: "docs/chat", attrs: { 'data-lang': 'js' } },
      { label: "Tool calling", slug: "docs/tool-calling", attrs: { 'data-lang': 'js go python' } },
      { label: "Model Context Protocol (MCP)", slug: "docs/model-context-protocol", attrs: { 'data-lang': 'js go' } },
      { label: "Pause generation using interrupts", slug: "docs/interrupts", attrs: { 'data-lang': 'js go python' } },
      { label: "Retrieval-augmented generation (RAG)", slug: "docs/rag", attrs: { 'data-lang': 'js go python' } },
      { label: "Building multi-agent systems", slug: "docs/multi-agent", attrs: { 'data-lang': 'js' } },
      { label: "Error types", slug: "docs/error-types", attrs: { 'data-lang': 'js go python' } },
      { label: "Evaluation", slug: "docs/evaluation", attrs: { 'data-lang': 'js go' } },
      { label: "Local observability and metrics", slug: "docs/local-observability", attrs: { 'data-lang': 'js go python' } },
    ],
  },
  {
    label: "Tutorials",
    items: [
      { label: "Chat with a PDF", slug: "docs/tutorials/chat-with-pdf", attrs: { 'data-lang': 'js' } },
      { label: "Summarize YouTube videos", slug: "docs/tutorials/summarize-youtube-videos", attrs: { 'data-lang': 'js' } },
    ],
  },
  {
    label: "Model Providers",
    items: [
      { label: "Google Generative AI", slug: "docs/integrations/google-genai", attrs: { 'data-lang': 'js go python' } },
      { label: "Google Vertex AI", slug: "docs/integrations/vertex-ai", attrs: { 'data-lang': 'js go python' } },
      { label: "OpenAI", slug: "docs/integrations/openai", attrs: { 'data-lang': 'js go python' } },
      { label: "OpenAI-Compatible APIs", slug: "docs/integrations/openai-compatible", attrs: { 'data-lang': 'js go' } },
      { label: "Anthropic (Claude)", slug: "docs/integrations/anthropic", attrs: { 'data-lang': 'go' } },
      { label: "xAI (Grok)", slug: "docs/integrations/xai", attrs: { 'data-lang': 'js' } },
      { label: "DeepSeek", slug: "docs/integrations/deepseek", attrs: { 'data-lang': 'js' } },
      { label: "Ollama", slug: "docs/integrations/ollama", attrs: { 'data-lang': 'js go python' } },
    ],
  },
  {
    label: "Database Providers",
    items: [
      { label: "MCP Toolbox for Databases", slug: "docs/integrations/toolbox", attrs: { 'data-lang': 'js go' } },
      { label: "Dev Local Vector Store", slug: "docs/integrations/dev-local-vectorstore", attrs: { 'data-lang': 'js go python' } },
      { label: "Pinecone", slug: "docs/integrations/pinecone", attrs: { 'data-lang': 'js go python' } },
      { label: "Chroma", slug: "docs/integrations/chroma", attrs: { 'data-lang': 'js' } },
      { label: "pgvector", slug: "docs/integrations/pgvector", attrs: { 'data-lang': 'js go python' } },
      { label: "LanceDB", slug: "docs/integrations/lancedb", attrs: { 'data-lang': 'js go python' } },
      { label: "Astra DB", slug: "docs/integrations/astra-db", attrs: { 'data-lang': 'js go python' } },
      { label: "Neo4j", slug: "docs/integrations/neo4j", attrs: { 'data-lang': 'js go python' } },
      { label: "AlloyDB for PostgreSQL", slug: "docs/integrations/alloydb", attrs: { 'data-lang': 'go' } },
      { label: "Cloud SQL PostgreSQL", slug: "docs/integrations/cloud-sql-postgresql", attrs: { 'data-lang': 'js go python' } },
      { label: "Cloud Firestore", slug: "docs/integrations/cloud-firestore", attrs: { 'data-lang': 'js go python' } },
      { label: "Vertex AI Vectosearch with Bigquery", slug: "docs/integrations/vectorsearch-bigquery", attrs: { 'data-lang': 'js go python' } },
      { label: "Vertex AI Vectosearch with Firestore", slug: "docs/integrations/vectorsearch-firestore", attrs: { 'data-lang': 'js go python' } },
    ],
  },
  {
    label: "Web Framework Integrations",
    items: [
      { label: "Express.js", slug: "docs/frameworks/express", attrs: { 'data-lang': 'js' } },
      { label: "Next.js", slug: "docs/frameworks/nextjs", attrs: { 'data-lang': 'js' } },
      { label: "Angular", slug: "docs/frameworks/angular", attrs: { 'data-lang': 'js' } },
      { label: "Flask", slug: "docs/frameworks/flask", attrs: { 'data-lang': 'python' } },
    ],
  },
  {
    label: "Deployment",
    items: [
      { label: "Firebase", slug: "docs/deployment/firebase", attrs: { 'data-lang': 'js' } },
      { label: "Cloud Run", slug: "docs/deployment/cloud-run", attrs: { 'data-lang': 'js go python' } },
      { label: "Any Platform", slug: "docs/deployment/any-platform", attrs: { 'data-lang': 'js go python' } },
      { label: "Client App Integration", slug: "docs/client", attrs: { 'data-lang': 'js go python' } },
    ],
  },
  {
    label: "Authorization",
    items: [
      { label: "Authorization & Integrity", slug: "docs/deployment/authorization", attrs: { 'data-lang': 'js' } },
      { label: "Auth0 AI", slug: "docs/integrations/auth0", attrs: { 'data-lang': 'js' } },
    ],
  },
  {
    label: "Writing Plugins",
    items: [
      { label: "Overview", slug: "docs/plugin-authoring/overview", attrs: { 'data-lang': 'js go' } },
      { label: "Writing Genkit Evaluators", slug: "docs/plugin-authoring/evaluators", attrs: { 'data-lang': 'js' } },
    ],
  },
  {
    label: "Observability and Monitoring",
    items: [
      { label: "Getting started", slug: "docs/observability/getting-started", attrs: { 'data-lang': 'js go' } },
      { label: "Authentication", slug: "docs/observability/authentication", attrs: { 'data-lang': 'js go' } },
      { label: "Telemetry Collection", slug: "docs/observability/telemetry-collection", attrs: { 'data-lang': 'js go' } },
      { label: "Advanced Configuration", slug: "docs/observability/advanced-configuration", attrs: { 'data-lang': 'js go' } },
      { label: "Troubleshooting", slug: "docs/observability/troubleshooting", attrs: { 'data-lang': 'js go' } },
    ],
  },
  {
    label: "Reference",
    items: [
      { label: "API References", slug: "docs/api-references", attrs: { 'data-lang': 'js go python' } },
      { label: "API Stability", slug: "docs/api-stability", attrs: { 'data-lang': 'js go python' } },
      { label: "Feedback", slug: "docs/feedback", attrs: { 'data-lang': 'js go python' } },
    ],
  },
];

export const sidebar = [
  ...DOCS_SIDEBAR,
];

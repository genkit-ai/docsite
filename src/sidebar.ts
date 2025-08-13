const DOCS_SIDEBAR = [
  { label: "Get started", slug: "docs/get-started" },
  { label: "Developer tools", slug: "docs/devtools" },
  { label: "MCP Server", slug: "docs/mcp-server" },
  {
    label: "Tutorials",
    items: [
      { label: "Chat with a PDF", slug: "docs/tutorials/chat-with-pdf" },
      { label: "Summarize YouTube videos", slug: "docs/tutorials/summarize-youtube-videos" },
    ],
  },
  {
    label: "Building AI workflows",
    items: [
      { label: "Generating content", slug: "docs/models" },
      { label: "Passing information through context", slug: "docs/context" },
      { label: "Creating flows", slug: "docs/flows" },
      { label: "Managing prompts with Dotprompt", slug: "docs/dotprompt" },
      { label: "Creating persistent chat sessions", slug: "docs/chat" },
      { label: "Tool calling", slug: "docs/tool-calling" },
      { label: "Model Context Protocol (MCP)", slug: "docs/model-context-protocol" },
      { label: "Pause generation using interrupts", slug: "docs/interrupts" },
      { label: "Retrieval-augmented generation (RAG)", slug: "docs/rag" },
      { label: "Building multi-agent systems", slug: "docs/multi-agent" },
      { label: "Error handling", slug: "docs/error-handling" },
      { label: "Evaluation", slug: "docs/evaluation" },
      { label: "Local observability and metrics", slug: "docs/local-observability" },
    ],
  },
  {
    label: "AI Providers",
    items: [
      { label: "Overview", slug: "docs/plugins/overview" },
      { label: "Google AI", slug: "docs/plugins/google-ai" },
      { label: "Vertex AI", slug: "docs/plugins/vertex-ai" },
      { label: "OpenAI", slug: "docs/plugins/openai" },
      { label: "OpenAI-Compatible APIs", slug: "docs/plugins/openai-compatible" },
      { label: "Anthropic (Claude)", slug: "docs/plugins/anthropic" },
      { label: "xAI (Grok)", slug: "docs/plugins/xai" },
      { label: "DeepSeek", slug: "docs/plugins/deepseek" },
      { label: "Ollama", slug: "docs/plugins/ollama" },
    ],
  },
  {
    label: "Vector Databases",
    items: [
      { label: "Dev Local Vector Store", slug: "docs/vector-databases/dev-local-vectorstore" },
      { label: "Pinecone", slug: "docs/vector-databases/pinecone" },
      { label: "ChromaDB", slug: "docs/vector-databases/chromadb" },
      { label: "pgvector", slug: "docs/vector-databases/pgvector" },
      { label: "LanceDB", slug: "docs/vector-databases/lancedb" },
      { label: "Astra DB", slug: "docs/vector-databases/astra-db" },
      { label: "Neo4j", slug: "docs/vector-databases/neo4j" },
      { label: "AlloyDB for PostgreSQL", slug: "docs/vector-databases/alloydb" },
      { label: "Cloud SQL PostgreSQL", slug: "docs/vector-databases/cloud-sql-postgresql" },
      { label: "Cloud Firestore", slug: "docs/vector-databases/cloud-firestore" },
    ],
  },
  {
    label: "Web Framework Integrations",
    items: [
      { label: "Express.js", slug: "docs/frameworks/express" },
      { label: "Next.js", slug: "docs/frameworks/nextjs" },
      { label: "Angular", slug: "docs/frameworks/angular" },
    ],
  },
  {
    label: "Deployment",
    items: [
      { label: "Overview", slug: "docs/deployment" },
      { label: "Firebase", slug: "docs/deployment/firebase" },
      { label: "Cloud Run", slug: "docs/deployment/cloud-run" },
      { label: "Any Platform", slug: "docs/deployment/any-platform" },
      { label: "Authorization & Security", slug: "docs/deployment/authorization" },
      { label: "Client Access Patterns", slug: "docs/client" },
    ],
  },
  {
    label: "Writing Plugins",
    items: [
      { label: "Overview", slug: "docs/plugin-authoring/overview" },
      { label: "Model Plugins", slug: "docs/plugin-authoring/models" },
    ],
  },
  {
    label: "Observability and Monitoring",
    items: [
      { label: "Overview", slug: "docs/observability/overview" },
      { label: "Complete Guide", slug: "docs/observability-monitoring" },
      { label: "Authentication & Setup", slug: "docs/observability/authentication" },
      { label: "Advanced Configuration", slug: "docs/observability/advanced-configuration" },
      { label: "Troubleshooting", slug: "docs/observability/troubleshooting" },
    ],
  },
  {
    label: "Templates",
    items: [
      { label: "pgvector Retriever", slug: "docs/templates/pgvector-retriever" },
    ],
  },
  {
    label: "Reference",
    items: [
      { label: "API References", slug: "docs/api-references" },
    ],
  },
];

export const sidebar = [
  { label: "Introduction", slug: "" },
  {
    label: "Documentation",
    items: DOCS_SIDEBAR,
    collapsed: false,
  },
];

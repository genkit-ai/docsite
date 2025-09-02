const DOCS_SIDEBAR = [
  {
    label: "Get started",
    items: [
      { label: "Get started", slug: "docs/get-started" },
      { label: "Developer tools", slug: "docs/devtools" },
    ],
  },
    {
    label: "Build with AI",
    items: [
      { label: "Genkit MCP Server", slug: "docs/mcp-server" },
      { label: "AI-Assisted Development", slug: "docs/develop-with-ai" },
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
      { label: "Error types", slug: "docs/error-types" },
      { label: "Evaluation", slug: "docs/evaluation" },
      { label: "Local observability and metrics", slug: "docs/local-observability" },
    ],
  },
  {
    label: "Tutorials",
    items: [
      { label: "Chat with a PDF", slug: "docs/tutorials/chat-with-pdf" },
      { label: "Summarize YouTube videos", slug: "docs/tutorials/summarize-youtube-videos" },
    ],
  },
  {
    label: "Model Providers",
    items: [
      { label: "Google Generative AI", slug: "docs/integrations/google-genai" },
      { label: "Google Vertex AI", slug: "docs/integrations/vertex-ai" },
      { label: "OpenAI", slug: "docs/integrations/openai" },
      { label: "OpenAI-Compatible APIs", slug: "docs/integrations/openai-compatible" },
      { label: "Anthropic (Claude)", slug: "docs/integrations/anthropic" },
      { label: "xAI (Grok)", slug: "docs/integrations/xai" },
      { label: "DeepSeek", slug: "docs/integrations/deepseek" },
      { label: "Ollama", slug: "docs/integrations/ollama" },
    ],
  },
  {
    label: "Database Providers",
    items: [
      { label: "MCP Toolbox for Databases", slug: "docs/integrations/toolbox" },
      { label: "Dev Local Vector Store", slug: "docs/integrations/dev-local-vectorstore" },
      { label: "Pinecone", slug: "docs/integrations/pinecone" },
      { label: "ChromaDB", slug: "docs/integrations/chromadb" },
      { label: "pgvector", slug: "docs/integrations/pgvector" },
      { label: "LanceDB", slug: "docs/integrations/lancedb" },
      { label: "Astra DB", slug: "docs/integrations/astra-db" },
      { label: "Neo4j", slug: "docs/integrations/neo4j" },
      { label: "AlloyDB for PostgreSQL", slug: "docs/integrations/alloydb" },
      { label: "Cloud SQL PostgreSQL", slug: "docs/integrations/cloud-sql-postgresql" },
      { label: "Cloud Firestore", slug: "docs/integrations/cloud-firestore" },
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
    label: "Reference",
    items: [
      { label: "API References", slug: "docs/api-references" },
    ],
  },
];

export const sidebar = [
  { label: "Introduction", slug: "" },
  ...DOCS_SIDEBAR,
];

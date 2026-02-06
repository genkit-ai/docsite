const DOCS_SIDEBAR = [
  {
    label: "Get started",
    items: [
      { label: "Overview", slug: "docs/overview" },
      { label: "Get started", slug: "docs/get-started" },
      { label: "Developer tools", slug: "docs/devtools" },
    ],
  },
  {
    label: "Building AI workflows",
    items: [
      { label: "Creating flows", slug: "docs/flows" },
      { label: "Generating content", slug: "docs/models" },
      { label: "Tool calling", slug: "docs/tool-calling" },
      { label: "Implementing Agentic Patterns", slug: "docs/agentic-patterns" },
      { label: "Managing prompts with Dotprompt", slug: "docs/dotprompt" },
      { label: "Passing information through context", slug: "docs/context" },
      { label: "Pause generation using interrupts", slug: "docs/interrupts" },
      { label: "Creating persistent chat sessions", slug: "docs/chat" },
      { label: "Model Context Protocol (MCP)", slug: "docs/model-context-protocol" },
      { label: "Retrieval-augmented generation (RAG)", slug: "docs/rag" },
      { label: "Building multi-agent systems", slug: "docs/multi-agent" },
      { label: "Error types", slug: "docs/error-types" },
      { label: "Evaluation", slug: "docs/evaluation" },
      { label: "Local observability and metrics", slug: "docs/local-observability" },
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
      { label: "AWS Bedrock", slug: "docs/integrations/aws-bedrock" },
      { label: "Azure AI Foundry", slug: "docs/integrations/azure-foundry" },
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
      { label: "Chroma", slug: "docs/integrations/chroma" },
      { label: "pgvector", slug: "docs/integrations/pgvector" },
      { label: "LanceDB", slug: "docs/integrations/lancedb" },
      { label: "Astra DB", slug: "docs/integrations/astra-db" },
      { label: "Neo4j", slug: "docs/integrations/neo4j" },
      { label: "AlloyDB for PostgreSQL", slug: "docs/integrations/alloydb" },
      { label: "Cloud SQL PostgreSQL", slug: "docs/integrations/cloud-sql-postgresql" },
      { label: "Cloud Firestore", slug: "docs/integrations/cloud-firestore" },
      { label: "Vertex AI VectorSearch with Bigquery", slug: "docs/integrations/vectorsearch-bigquery" },
      { label: "Vertex AI VectorSearch with Firestore", slug: "docs/integrations/vectorsearch-firestore" },
    ],
  },
  {
    label: "Web Framework Integrations",
    items: [
      { label: "Express.js", slug: "docs/frameworks/express" },
      { label: "Next.js", slug: "docs/frameworks/nextjs" },
      { label: "Angular", slug: "docs/frameworks/angular" },
      { label: "FastAPI", slug: "docs/frameworks/fastapi" },
    ],
  },
  {
    label: "Deployment",
    items: [
      { label: "Firebase", slug: "docs/deployment/firebase" },
      { label: "Cloud Run", slug: "docs/deployment/cloud-run" },
      { label: "Any Platform", slug: "docs/deployment/any-platform" },
      { label: "Client App Integration", slug: "docs/client" },
    ],
  },
  {
    label: "Authorization",
    items: [
      { label: "Authorization & Integrity", slug: "docs/deployment/authorization" },
      { label: "Auth0 AI", slug: "docs/integrations/auth0" },
    ],
  },
  {
    label: "Writing Plugins",
    items: [
      { label: "Overview", slug: "docs/plugin-authoring/overview" },
    ],
  },
  {
    label: "Observability and Monitoring",
    items: [
      { label: "Getting started", slug: "docs/observability/getting-started" },
      { label: "Authentication", slug: "docs/observability/authentication" },
      { label: "Telemetry Collection", slug: "docs/observability/telemetry-collection" },
      { label: "Advanced Configuration", slug: "docs/observability/advanced-configuration" },
      { label: "Troubleshooting", slug: "docs/observability/troubleshooting" },
      { label: "Google Cloud Plugin", slug: "docs/integrations/google-cloud" },
    ],
  },
  {
    label: "Reference",
    items: [
      { label: "API References", slug: "docs/api-references" },
      { label: "API Stability", slug: "docs/api-stability" },
      { label: "Feedback", slug: "docs/feedback" },
    ],
  },
];

export const sidebar = [
  ...DOCS_SIDEBAR,
];

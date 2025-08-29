/**
 * Landing page content data
 */
import { codeExamples } from './codeSamples';

export const hero = {
  badge: "Built and used in production by Google",
  title: "One framework for building, debugging, and deploying AI-powered apps",
  subtitle: "Genkit is an open-source framework for integrating LLMs and building real features like chat, RAG, and agents with clean structured APIs.",
  primaryCta: { text: "Install Genkit", href: "/docs/get-started" },
  secondaryCta: { text: "View on Github", href: "https://github.com/firebase/genkit" }
} as const;

export const languageSelector = {
  title: "Genkit in your language",
  subtitle: "Get started with just a few lines of code.",
  ctaText: "Get Started",
  ctaHref: "/docs/get-started",
  languages: [
    { 
      name: "Node.js", 
      id: "nodejs",
      status: "STABLE", 
      active: true,
      icon: "nodejs"
    },
    { 
      name: "Go", 
      id: "go",
      status: "BETA", 
      active: false,
      icon: "go"
    },
    { 
      name: "Python", 
      id: "python",
      status: "ALPHA", 
      active: false,
      icon: "python"
    }
  ],
  codeExamples
} as const;

export const features = [
  {
    title: 'Unified APIs for any model',
    body: 'Use GoogleAI, OpenAI, Claude, and Ollama through one SDK.',
    href: '/docs/models',
    iconSrc: '/assets/unified_apis.svg'
  },
  {
    title: 'Composable workflows',
    body: 'Structure chat, RAG, tool use, and agents with built-in primitives.',
    href: '/docs/flows',
    iconSrc: '/assets/composable_workflows.svg'
  },
  {
    title: 'Production-ready tools',
    body: 'Local dev, debugging UI, and deployment to Firebase, Cloud Run, or your stack.',
    href: '/docs/devtools',
    iconSrc: '/assets/production_ready.svg'
  }
] as const;

export const developerTools = {
  title: "Built-in developer tools",
  subtitle: "Run, debug and observe your AI workflows from the local developer UI.",
  image: "/assets/dev_ui.png",
  steps: [
    {
      number: 1,
      title: "Install Genkit",
      description: "Choose your SDK and provider (e.g. GoogleAI, OpenAI)."
    },
    {
      number: 2, 
      title: "Build AI logic",
      description: "Define prompts, flows, and tools in code."
    },
    {
      number: 3,
      title: "Debug & iterate", 
      description: "Use the Genkit CLI and Developer UI to inspect behaviour."
    },
    {
      number: 4,
      title: "Deploy anywhere",
      description: "Run on Firebase, Cloud Run, or your own infrastructure."
    }
  ],
  cta: { text: "Install Genkit", href: "/docs/get-started" }
} as const;

export const exampleShowcase = {
  leftTitle: "Genkit by Example",
  leftBody: "See how Genkit works with Firebase, Angular, Next.js and more in production-ready apps, with pre-built demos and code you can reuse.",
  leftCtaText: "Launch Genkit by Example",
  leftCtaUrl: "/docs/tutorials",
  rightTitle: "Simple Chatbot",
  rightNote: "Create a chatbot with the context of a business via tools and real-time responses.",
  rightCtaText: "Try this example", 
  rightCtaUrl: "/docs/tutorials/tutorial-chat-with-a-pdf",
  imageSrc: "/assets/simple_chatbot.svg"
} as const;

export const resourceCards = [
  {
    title: "Docs",
    description: "Developer guide, API reference, tutorials",
    href: "/docs",
    icon: "document" as const
  },
  {
    title: "GitHub",
    description: "Source code, issues, community", 
    href: "https://github.com/firebase/genkit",
    icon: "code" as const
  }
] as const;

export const finalCta = {
  title: "Get Started Today",
  subtitle: "",
  cta: { text: "Install Genkit", href: "/docs/get-started" }
} as const;

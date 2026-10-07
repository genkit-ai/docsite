/**
 * Single source of truth for the genkit.dev landing page.
 *
 * The same content is rendered three ways:
 * - HTML for people: `src/pages/index.astro` and `src/components/landing/*`.
 * - Structured data (JSON-LD) for search engines: `buildLandingJsonLd()`.
 * - Markdown for AI agents and LLM tools, served at `/index.md`:
 *   `buildLandingMarkdown()`.
 *
 * Edit copy here so all three stay in sync.
 */

export const SITE_URL = 'https://genkit.dev';
export const GITHUB_URL = 'https://github.com/genkit-ai/genkit';
export const DISCORD_URL = 'https://discord.gg/qXt5zzQKpc';
export const EXAMPLES_URL = 'https://examples.genkit.dev/';

export type SdkId = 'js' | 'go' | 'python' | 'dart';

export interface Sdk {
  /** Matches the language ids used by `unifiedPageManager`. */
  id: SdkId;
  label: string;
  icon: string;
  status: 'GA' | 'Preview';
  install: string;
  quickstart: string;
}

export const sdks: Sdk[] = [
  {
    id: 'js',
    label: 'TypeScript',
    icon: 'typescript',
    status: 'GA',
    install: 'npm i genkit @genkit-ai/google-genai',
    quickstart: '/docs/js/get-started/',
  },
  {
    id: 'go',
    label: 'Go',
    icon: 'go',
    status: 'GA',
    install: 'go get github.com/firebase/genkit/go',
    quickstart: '/docs/go/get-started/',
  },
  {
    id: 'python',
    label: 'Python',
    icon: 'python',
    status: 'Preview',
    install: 'pip install genkit genkit-google-genai',
    quickstart: '/docs/python/get-started/',
  },
  {
    id: 'dart',
    label: 'Dart',
    icon: 'dart',
    status: 'Preview',
    install: 'dart pub add genkit genkit_google_genai',
    quickstart: '/docs/dart/get-started/',
  },
];

export const meta = {
  title: "Genkit | Google's open-source framework for AI apps & agents",
  description:
    "Genkit is Google's open-source framework for building AI-powered apps and agents in TypeScript, Go, Python, and Dart. Use Gemini, Claude, OpenAI, and more.",
  ogImage: `${SITE_URL}/ogimage.png?v=1`,
  ogImageAlt: 'Genkit logo',
};

export const hero = {
  title: 'Build agentic apps that do more than chat',
  /** The part of the title shown in the accent color. */
  highlight: 'more than chat',
  lead: "Genkit is an open-source AI SDK and toolkit for building full-stack agentic experiences for any platform. Available in TypeScript, Go, Dart, and Python",
  /** The button under the install command. It links to the selected language's quickstart. */
  cta: 'Get started',
};

/** The last tab of the install widget: skills that teach coding agents Genkit. */
export const agentSkills = {
  label: 'Agent skills',
  /** Used on small phones, where the full label doesn't fit. */
  shortLabel: 'Skills',
  install: 'npx skills add genkit-ai/skills',
  summary:
    'Genkit agent skills teach Antigravity, Claude Code, Cursor, and other coding agents to build with Genkit.',
  cta: { label: 'Set up agent skills', href: '/docs/develop-with-ai' },
};

/**
 * The hero illustration: a ticketing app built with Genkit. The callouts show
 * the Genkit code behind each moment, in the reader's language.
 */
export const heroDemo = {
  description:
    "Example: a ticketing app built with Genkit. Someone asks for two seats at Saturday's show. The app calls your findSeats tool, answers with a seat map and seat options they can tap instead of text (GenUI), and buys the seats they pick with your buyTickets tool.",
  callouts: {
    tools: 'Tool calling',
    genui: 'GenUI',
  },
  code: {
    js: { tools: 'tools: [findSeats, buyTickets]', genui: 'use: [a2ui()]' },
    go: { tools: 'ai.WithTools(findSeats, buyTickets)', genui: 'ai.WithUse(&a2uix.Surfaces{})' },
    python: { tools: 'tools=[find_seats, buy_tickets]', genui: 'use=[Surfaces()]' },
    dart: { tools: 'tools: [findSeats, buyTickets]', genui: 'use: [a2ui()]' },
  } satisfies Record<SdkId, { tools: string; genui: string }>,
};

export interface ToolSnippet {
  lang: SdkId;
  filename: string;
  code: string;
}

/**
 * The same small app in every SDK: give a model a tool that calls your code,
 * then ask it a question it can only answer with that tool. Used in the
 * markdown version of the page.
 */
export const toolSnippets: ToolSnippet[] = [
  {
    lang: 'js',
    filename: 'index.ts',
    code: `import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({ plugins: [googleAI()] });

// Give the model a tool that calls your code
const lookupOrder = ai.defineTool({
  name: 'lookupOrder',
  description: 'Get the shipping status of an order',
  inputSchema: z.object({ orderId: z.string() }),
}, async ({ orderId }) => getOrderStatus(orderId));

const { text } = await ai.generate({
  model: googleAI.model('gemini-flash-latest'),
  prompt: "Where's my order #1042?",
  tools: [lookupOrder],
});`,
  },
  {
    lang: 'go',
    filename: 'main.go',
    code: `g := genkit.Init(ctx,
\tgenkit.WithPlugins(&googlegenai.GoogleAI{}),
)

type OrderInput struct {
\tOrderID string \`json:"orderId"\`
}

// Give the model a tool that calls your code
lookupOrder := genkit.DefineTool(g, "lookupOrder",
\t"Get the shipping status of an order",
\tfunc(ctx *ai.ToolContext, in OrderInput) (string, error) {
\t\treturn getOrderStatus(in.OrderID)
\t})

resp, err := genkit.Generate(ctx, g,
\tai.WithModelName("googleai/gemini-flash-latest"),
\tai.WithPrompt("Where's my order #1042?"),
\tai.WithTools(lookupOrder),
)`,
  },
  {
    lang: 'python',
    filename: 'main.py',
    code: `from genkit import Genkit
from genkit_google_genai import GoogleAI
from pydantic import BaseModel

ai = Genkit(plugins=[GoogleAI()])

class OrderInput(BaseModel):
    order_id: str

# Give the model a tool that calls your code
@ai.tool()
async def lookup_order(input: OrderInput) -> str:
    """Get the shipping status of an order."""
    return await get_order_status(input.order_id)

response = await ai.generate(
    model='googleai/gemini-flash-latest',
    prompt="Where's my order #1042?",
    tools=[lookup_order],
)`,
  },
  {
    lang: 'dart',
    filename: 'main.dart',
    code: `@Schema()
abstract class $OrderInput {
  String get orderId;
}

final ai = Genkit(plugins: [googleAI()]);

// Give the model a tool that calls your code
final lookupOrder = ai.defineTool(
  name: 'lookupOrder',
  description: 'Get the shipping status of an order',
  inputSchema: OrderInput.$schema,
  fn: (input, _) async => getOrderStatus(input.orderId),
);

final response = await ai.generate(
  model: googleAI.gemini('gemini-flash-latest'),
  prompt: "Where's my order #1042?",
  tools: [lookupOrder],
);`,
  },
];

export interface DocLink {
  label: string;
  href: string;
}

export type UseCaseId =
  | 'assistants'
  | 'extraction'
  | 'knowledge'
  | 'media'
  | 'agents'
  | 'generative-ui';

export interface UseCase {
  id: UseCaseId;
  /** The short tab label in the showcase. */
  label: string;
  title: string;
  summary: string;
  /** Describes the illustration for screen readers and agents. */
  example: string;
  /** Docs for the features behind the use case. Listed in the markdown version. */
  learnMore: DocLink[];
}

export const whatYouCanBuild = {
  title: 'What will you build?',
  examplesCta: { label: 'Try live demos', href: EXAMPLES_URL },
};

export const useCases: UseCase[] = [
  {
    id: 'assistants',
    label: 'Chat',
    title: 'Chat assistants',
    summary: 'Support, shopping, and in-app help that answers in real time.',
    example: 'A chat assistant recommends the right pricing plan for a team of five.',
    learnMore: [
      { label: 'Agents and chat', href: '/docs/agents/overview' },
      { label: 'Streaming', href: '/docs/flows#streaming-flows' },
    ],
  },
  {
    id: 'extraction',
    label: 'Documents',
    title: 'Documents into data',
    summary: 'Turn receipts, invoices, and PDFs into clean, structured data.',
    example:
      'A photo of a café receipt becomes structured fields for merchant, date, total, and category.',
    learnMore: [
      { label: 'Structured output', href: '/docs/models#structured-output' },
      { label: 'Multimodal input', href: '/docs/models#multimodal-input' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Answers',
    title: 'Answers from your content',
    summary: 'Ask your docs, help center, or files. Get answers with sources.',
    example: 'An assistant answers a vacation policy question and cites the employee handbook.',
    learnMore: [
      { label: 'Retrieval (RAG)', href: '/docs/rag' },
      { label: 'MCP', href: '/docs/model-context-protocol' },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    title: 'Images and media',
    summary: 'Generate product shots, art, and marketing copy from a prompt.',
    example: 'One text prompt generates product photos of a speckled mug in three glazes.',
    learnMore: [
      { label: 'Image generation', href: '/docs/models#generating-media' },
      { label: 'Prompt templates', href: '/docs/dotprompt' },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    title: 'Agents that take action',
    summary: 'Look things up, call your APIs, and ask a person before anything important.',
    example:
      'An agent looks up an order, checks the refund policy, and waits for a person to approve the refund.',
    learnMore: [
      { label: 'Tool calling', href: '/docs/tool-calling' },
      { label: 'Human approval', href: '/docs/agents/interrupts' },
    ],
  },
  {
    id: 'generative-ui',
    label: 'GenUI',
    title: 'GenUI',
    summary: 'Answer with charts, forms, and buttons people can tap, not walls of text.',
    example:
      'Asked how the quarter went, an assistant answers with an interactive revenue chart instead of a paragraph.',
    learnMore: [
      { label: 'GenUI (A2UI)', href: '/docs/agents/a2ui' },
      { label: 'Client SDKs', href: '/docs/client' },
    ],
  },
];

export interface Step {
  id: string;
  title: string;
  body: string;
  links: DocLink[];
}

export const howItWorks = {
  title: 'Any model. Your language. Every step visible.',
  lead: 'Genkit connects your app to AI models, calls your code, and shows every step to you and to your coding agent.',
};

export const steps: Step[] = [
  {
    id: 'agents',
    title: 'Build it with your coding agent',
    body: "Genkit gives coding agents guardrails, not guesswork. Agent skills teach Antigravity, Claude Code, and Cursor today's Genkit APIs. The Genkit MCP server lets them run your flows and read the traces, so they check their own work before you review it.",
    links: [
      { label: 'Set up agent skills', href: '/docs/develop-with-ai' },
      { label: 'Connect the MCP server', href: '/docs/mcp-server' },
    ],
  },
  {
    id: 'models',
    title: 'Pick any model',
    body: 'Gemini, Claude, OpenAI, open models with Ollama, and more. Switching is one line.',
    links: [{ label: 'Browse model providers', href: '/docs/integrations/model-providers' }],
  },
  {
    id: 'languages',
    title: 'Build in your language',
    body: 'Official SDKs for TypeScript, Go, Python, and Dart, built on the same concepts.',
    links: [{ label: 'Choose your SDK', href: '/docs/get-started' }],
  },
  {
    id: 'ship',
    title: 'Test it, then ship it',
    body: 'See every prompt, tool call, and response in the local Developer UI. Then deploy to Cloud Run, Firebase, or anywhere your code runs.',
    links: [
      { label: 'Explore the Developer UI', href: '/docs/devtools' },
      { label: 'Deploy your app', href: '/docs/deployment/overview' },
    ],
  },
];

/** Models shown in the "Pick any model" switcher. Ids match the docs. */
export const modelChoices = [
  { id: 'gemini', label: 'Gemini', ref: "googleAI.model('gemini-flash-latest')" },
  { id: 'claude', label: 'Claude', ref: "anthropic.model('claude-opus-4-8')" },
  { id: 'openai', label: 'OpenAI', ref: "openAI.model('gpt-5.5')" },
  { id: 'ollama', label: 'Ollama', ref: "ollama.model('gemma4:latest')" },
];

/** One call, four SDKs: shown in the "Build in your language" step. */
export const sameCallPerLanguage: Record<SdkId, string> = {
  js: 'await ai.generate({ prompt })',
  go: 'genkit.Generate(ctx, g, ai.WithPrompt(prompt))',
  python: 'await ai.generate(prompt=prompt)',
  dart: 'await ai.generate(prompt: prompt)',
};

/** Listed at the end of the markdown version of the page. */
export const community = [
  { id: 'github', label: 'Star on GitHub', href: GITHUB_URL },
  { id: 'discord', label: 'Chat on Discord', href: DISCORD_URL },
  { id: 'examples', label: 'Try live demos', href: EXAMPLES_URL },
  { id: 'blog', label: 'Read the blog', href: '/blog' },
];

export interface Faq {
  question: string;
  answer: string;
  link?: DocLink;
}

export const faqSection = {
  title: 'Frequently asked questions',
  lead: "Can't find what you're looking for?",
  discord: { label: 'Ask the community on Discord', href: DISCORD_URL },
};

export const faqs: Faq[] = [
  {
    question: 'What is Genkit?',
    answer:
      'Genkit is an open-source framework from Google for building AI features into apps. It gives you one consistent way to call AI models, connect them to your data and code, and test and deploy the results, in TypeScript, Go, Python, or Dart.',
  },
  {
    question: 'Do I need to be an AI expert to use Genkit?',
    answer:
      'No. If you can build an app, you can build with Genkit. Common features like chat, structured data, and answers from your content take a few lines of code. You can also install Genkit skills so AI coding assistants like Antigravity, Claude Code, and Cursor can write Genkit code for you.',
    link: { label: 'Build with AI coding assistants', href: '/docs/develop-with-ai' },
  },
  {
    question: "How is Genkit different from calling a model's API directly?",
    answer:
      "A model API sends a prompt and returns a response. Genkit adds what real apps need on top: one API across model providers, structured output, tool calling, retrieval, streaming, agents, and a local Developer UI that traces every step. You can switch models without rewriting your app.",
  },
  {
    question: 'Which AI models does Genkit support?',
    answer:
      "Gemini (through the Gemini API or Gemini Enterprise), Anthropic Claude, OpenAI, xAI Grok, DeepSeek, models hosted on AWS Bedrock and Azure AI Foundry, open models like Gemma and Llama through Ollama, and any OpenAI-compatible API.",
    link: { label: 'See all model providers', href: '/docs/integrations/model-providers' },
  },
  {
    question: 'Which programming languages can I use?',
    answer:
      'Genkit has official SDKs for TypeScript and JavaScript, Go, Python, and Dart.',
    link: { label: 'Get started in your language', href: '/docs/get-started' },
  },
  {
    question: 'Is Genkit free?',
    answer:
      'Yes. Genkit is free and open source under the Apache 2.0 license. You only pay for the models and hosting you choose to use.',
    link: { label: 'View the source on GitHub', href: GITHUB_URL },
  },
  {
    question: 'Where can I deploy Genkit apps?',
    answer:
      'Anywhere your code runs. The docs include guides for Cloud Run, Firebase, AWS Lambda, and Azure Functions, and you can run Genkit on any server that supports your language.',
    link: { label: 'Read the deployment guides', href: '/docs/deployment/overview' },
  },
];

const absoluteUrl = (href: string) => (href.startsWith('http') ? href : `${SITE_URL}${href}`);

/**
 * Structured data for search engines: who makes Genkit, what it is, and the
 * FAQ. Keep it in sync with visible content (it is derived from it).
 */
export function buildLandingJsonLd() {
  const orgId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  const softwareId = `${SITE_URL}/#software`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'Genkit',
        url: SITE_URL,
        logo: `${SITE_URL}/genkit_logo_icon_only_light.png`,
        parentOrganization: { '@type': 'Organization', name: 'Google', url: 'https://google.com' },
        sameAs: [
          GITHUB_URL,
          'https://x.com/GenkitFramework',
          'https://www.linkedin.com/company/genkit',
          'https://reddit.com/r/GenkitFramework',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: 'Genkit',
        url: SITE_URL,
        description: meta.description,
        publisher: { '@id': orgId },
        inLanguage: 'en',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': softwareId,
        name: 'Genkit',
        description: meta.description,
        url: SITE_URL,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Linux, macOS, Windows',
        license: 'https://www.apache.org/licenses/LICENSE-2.0',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@id': orgId },
        featureList: useCases.map((useCase) => `${useCase.title}: ${useCase.summary}`),
        softwareHelp: { '@type': 'CreativeWork', url: `${SITE_URL}/docs/get-started` },
      },
      {
        '@type': 'SoftwareSourceCode',
        name: 'Genkit',
        codeRepository: GITHUB_URL,
        programmingLanguage: ['TypeScript', 'JavaScript', 'Go', 'Python', 'Dart'],
        license: 'https://www.apache.org/licenses/LICENSE-2.0',
        targetProduct: { '@id': softwareId },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };
}

/**
 * A markdown version of the landing page for AI agents and LLM tools.
 * Served at `/index.md` and advertised with `<link rel="alternate">`.
 */
export function buildLandingMarkdown() {
  const link = (item: DocLink) => `[${item.label}](${absoluteUrl(item.href)})`;
  const fence: Record<SdkId, string> = { js: 'ts', go: 'go', python: 'python', dart: 'dart' };

  const lines: string[] = [
    '# Genkit',
    '',
    `> ${meta.description}`,
    '',
    hero.lead,
    '',
    heroDemo.description,
    '',
    `- Website: ${SITE_URL}`,
    `- Documentation: ${SITE_URL}/docs/get-started`,
    `- Source code (Apache 2.0): ${GITHUB_URL}`,
    `- Full documentation for LLMs: ${SITE_URL}/llms.txt`,
    '',
    '## Get started',
    '',
    'Install the SDK for your language, then follow its quickstart.',
    '',
    '| Language | Status | Install | Quickstart |',
    '| --- | --- | --- | --- |',
    ...sdks.map(
      (sdk) =>
        `| ${sdk.label} | ${sdk.status === 'GA' ? 'Generally available' : 'Preview'} | \`${sdk.install}\` | ${absoluteUrl(sdk.quickstart)} |`,
    ),
    '',
    `### ${agentSkills.label}`,
    '',
    agentSkills.summary,
    '',
    '```sh',
    agentSkills.install,
    '```',
    '',
    `More: ${link(agentSkills.cta)}`,
    '',
    `## ${whatYouCanBuild.title}`,
    '',
  ];

  for (const useCase of useCases) {
    lines.push(
      `### ${useCase.title}`,
      '',
      useCase.summary,
      '',
      `Example: ${useCase.example}`,
      '',
      `Learn more: ${useCase.learnMore.map(link).join(', ')}`,
      '',
    );
  }

  lines.push(`Live demos: ${EXAMPLES_URL}`, '', `## ${howItWorks.title}`, '', howItWorks.lead, '');
  steps.forEach((step, index) => {
    lines.push(`${index + 1}. **${step.title}.** ${step.body} ${step.links.map(link).join(', ')}`);
  });

  lines.push(
    '',
    '## Example',
    '',
    'Give a model a tool that calls your code, so it can answer with live data. The same app in each SDK:',
    '',
  );
  for (const snippet of toolSnippets) {
    const sdk = sdks.find((item) => item.id === snippet.lang)!;
    lines.push(`### ${sdk.label} (\`${snippet.filename}\`)`, '', `\`\`\`${fence[snippet.lang]}`, snippet.code, '```', '');
  }

  lines.push(`## ${faqSection.title}`, '');

  for (const faq of faqs) {
    lines.push(`### ${faq.question}`, '', faq.link ? `${faq.answer} ${link(faq.link)}` : faq.answer, '');
  }

  lines.push(
    '## Resources for AI agents',
    '',
    `- [llms.txt](${SITE_URL}/llms.txt): index of the complete documentation, per language`,
    `- [GENKIT.js.md](${SITE_URL}/GENKIT.js.md): rules and examples for building with Genkit in TypeScript and JavaScript`,
    `- [GENKIT.go.md](${SITE_URL}/GENKIT.go.md): rules and examples for building with Genkit in Go`,
    `- Every documentation page is also available as markdown: append \`.md\` to its URL.`,
    '',
    '## Community',
    '',
    ...community.map((item) => `- ${link(item)}`),
    '',
  );

  return lines.join('\n');
}

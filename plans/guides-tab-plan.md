# Plan: Add "Guides" top-nav tab with separate sidebar

## Goal

Split the current monolithic Docs sidebar into two top-level navigation sections:
- **Docs** — Concepts, API patterns, integrations, reference
- **Guides** — Framework quickstarts, tutorials, frontend integration, deployment walkthroughs, plugin authoring

Each section gets its own sidebar and a horizontal tab-style link in the header, similar to Mastra's `Docs | Guides` pattern.

---

## Decisions

| Question | Decision |
|----------|----------|
| Choose your stack | Stays in **Docs** as a highly visible entry-point |
| Quickstart | Stays in **Docs** |
| Deployment guides | Move to **Guides** |
| Tutorials | Move to **Guides** |
| Writing plugins | Move to **Guides** — it's a step-by-step how-to |
| Header style | Horizontal in-header tabs, not vertical selector |

---

## Technical approach

### How Starlight path-based sidebars work

Starlight 0.34.3 supports keying the `sidebar` config by URL path prefix. Instead of a flat array, you pass an object:

```ts
sidebar: {
  '/docs/': [/* docs sidebar items */],
  '/guides/': [/* guides sidebar items */],
}
```

When a user is on `/guides/express`, Starlight renders only the guides sidebar. When on `/docs/flows`, it renders only the docs sidebar. This is the native mechanism — no plugins needed.

### Content restructuring

```
src/content/docs/
  docs/                          ← existing docs content, slimmed down
    overview.mdx
    choose-your-stack.mdx
    get-started.mdx
    flows.mdx
    models.mdx
    ...
  guides/                        ← NEW: how-to guides and walkthroughs
    overview.mdx                 ← hub page for /guides/
    frameworks/
      nextjs-app-router.mdx
      nextjs-pages.mdx
      astro.mdx
      angular.mdx
      express.mdx
      hono.mdx
      fastify.mdx
      fastapi.mdx
      flask.mdx
      django.mdx
      gin.mdx
      echo.mdx
      chi.mdx
      shelf.mdx
    frontend/
      web-client.mdx
      flutter.mdx
    deployment/
      firebase.mdx
      cloud-run.mdx
      azure-functions.mdx
      aws-lambda.mdx
      any-platform.mdx
      authorization.mdx
    tutorials/
      chat-with-pdf.mdx
      summarize-youtube-videos.mdx
    plugins/
      overview.mdx
```

### URL structure

| Current | New |
|---------|-----|
| `/docs/frameworks/express` | `/guides/frameworks/express` |
| `/docs/frameworks/web-client` | `/guides/frontend/web-client` |
| `/docs/frameworks/flutter` | `/guides/frontend/flutter` |
| `/docs/deployment/firebase` | `/guides/deployment/firebase` |
| `/docs/deployment/cloud-run` | `/guides/deployment/cloud-run` |
| `/docs/deployment/authorization` | `/guides/deployment/authorization` |
| `/docs/tutorials/chat-with-pdf` | `/guides/tutorials/chat-with-pdf` |
| `/docs/plugin-authoring/overview` | `/guides/plugins/overview` |
| `/docs/overview` | `/docs/overview` — unchanged |
| `/docs/flows` | `/docs/flows` — unchanged |

---

## Implementation steps

### 1. Create the guides content directory and move files

- [ ] Create `src/content/docs/guides/` directory structure
- [ ] Move `src/content/docs/docs/frameworks/*.mdx` → `src/content/docs/guides/frameworks/`
- [ ] Move `src/content/docs/docs/tutorials/*.mdx` → `src/content/docs/guides/tutorials/`
- [ ] Move `src/content/docs/docs/deployment/*.mdx` → `src/content/docs/guides/deployment/`
- [ ] Move `src/content/docs/docs/deployment/authorization.mdx` → `src/content/docs/guides/deployment/authorization.mdx`
- [ ] Move `src/content/docs/docs/plugin-authoring/overview.mdx` → `src/content/docs/guides/plugins/overview.mdx`
- [ ] Create `src/content/docs/guides/overview.mdx` as the guides hub/landing page
- [ ] Update all internal cross-references in moved files
- [ ] Update all references in docs files that link to moved pages

### 2. Split sidebar config

- [ ] Refactor `src/sidebar.ts` to export two sidebar arrays: `DOCS_SIDEBAR` and `GUIDES_SIDEBAR`
- [ ] Export `sidebar` as a path-keyed object: `{ '/docs/': DOCS_SIDEBAR, '/guides/': GUIDES_SIDEBAR }`
- [ ] Docs sidebar keeps:
  ```
  Get started
    Introduction
    Choose your stack
    Quickstart
    Developer tools
    Work with Genkit in AI tools
  Building AI workflows
    Creating flows
    Generating content
    Middleware
    Tool calling
    Implementing agentic patterns
    Managing prompts with Dotprompt
    Passing information through context
    Pause generation using interrupts
    Creating persistent chat sessions
    Model Context Protocol
    Retrieval-augmented generation
    Building multi-agent systems
    Error types
    Evaluation
    Local observability and metrics
  Model providers
    Google Generative AI, Vertex AI, OpenAI, etc.
  Database providers
    Pinecone, Chroma, pgvector, etc.
  Authorization
    Auth0 AI
  Observability and monitoring
    Getting started, Authentication, etc.
  Reference
    API references, API stability, Feedback
  ```
- [ ] Guides sidebar:
  ```
  Overview
  Server & full-stack frameworks
    Next.js App Router
    Next.js Pages Router
    Astro
    Angular
    Express
    Hono
    Fastify
    FastAPI
    Flask
    Django
    Gin
    Echo
    Chi
    Shelf
  Frontend integration
    Web client
    Flutter
  Deployment
    Firebase
    Cloud Run
    Azure Functions
    AWS Lambda
    Any platform
    Authorization & integrity
  Tutorials
    Chat with a PDF
    Summarize YouTube videos
  Writing plugins
    Overview
  ```
- [ ] Extend `createLanguageMetadataMap` to process guides sidebar items

### 3. Add horizontal nav tabs to the header

- [ ] Modify `src/content/custom/header.astro` to add "Docs" and "Guides" tab links
- [ ] Position between `SiteTitle` and the search/social section, inline in the header
- [ ] Styling: horizontal links with an active underline indicator
- [ ] "Docs" links to `/docs/overview`
- [ ] "Guides" links to `/guides/`
- [ ] Active state detection: check `Astro.url.pathname` starts with `/guides/` or `/docs/`
- [ ] Visible on both desktop and mobile — not hidden behind the mobile menu

### 4. Adapt the custom sidebar for guides

- [ ] Update `src/components/sidebar.astro` language filtering to handle `/guides/` path prefix
- [ ] The sidebar script's URL rewriting logic needs to handle `/guides/{lang}/frameworks/express` patterns
- [ ] Language metadata maps need entries for guide slugs
- [ ] Language dropdown appears in both sidebars

### 5. Set up redirects

- [ ] Add 301 redirects in `firebase.json` for all moved URLs:
  - `/docs/frameworks/*` → `/guides/frameworks/*`
  - `/docs/tutorials/*` → `/guides/tutorials/*`
  - `/docs/deployment/*` → `/guides/deployment/*`
  - `/docs/plugin-authoring/*` → `/guides/plugins/*`
- [ ] Include language-prefixed variants: `/docs/js/frameworks/*` → `/guides/js/frameworks/*`

### 6. Update cross-references

- [ ] Update `choose-your-stack.mdx` links from `/docs/frameworks/X` to `/guides/frameworks/X`
- [ ] Update `choose-your-stack.mdx` deployment links to `/guides/deployment/X`
- [ ] Update framework guide next-step links — verify `/docs/flows` etc. still resolve correctly
- [ ] Update `overview.mdx` hero action link if it references framework or deployment paths
- [ ] Update landing page components if they reference moved paths
- [ ] Run `starlight-links-validator` to catch any broken links

### 7. Update build and sitemap

- [ ] Update `pnpm format:docs` script glob to include `src/content/docs/guides/**/*.mdx`
- [ ] Update `generate-language-pages.ts` to handle `/guides/` path prefix
- [ ] Update sitemap filter in `astro.config.mjs` to include `/guides/` paths
- [ ] Update `gen-bundle.ts` and `generate-llms-direct.ts` if they scan docs paths

### 8. Visual polish

- [ ] Style header tabs to match site design: font, spacing, color
- [ ] Active tab indicator: bottom border or underline in accent color
- [ ] Test dark mode and light mode
- [ ] Test mobile: tabs visible in header, sidebar switches correctly
- [ ] Verify "Docs ↔ Guides" cross-links work cleanly

---

## What stays in Docs vs moves to Guides

### Stays in Docs sidebar

```
Get started
  Introduction
  Choose your stack
  Quickstart
  Developer tools
  Work with Genkit in AI tools
Building AI workflows
  14 concept/API pages
Model providers
  10 integration pages
Database providers
  13 integration pages
Authorization
  Auth0 AI
Observability and monitoring
  6 pages
Reference
  API references, API stability, Feedback
```

### Moves to Guides sidebar

```
Overview — new hub page
Server & full-stack frameworks — 14 framework guides
Frontend integration — 2 client guides
Deployment — 5 deployment guides + authorization
Tutorials — 2 tutorial pages
Writing plugins — 1 page
```

Total: ~24 pages move to Guides, ~50+ pages stay in Docs.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Broken links from external sites | 301 redirects in firebase.json for all old URLs |
| SEO ranking loss from URL changes | 301 redirects preserve link equity |
| Language filtering breaks for guides | Test guides sidebar with language filter before merging |
| Cross-references between docs and guides create confusion | Use clear, descriptive link text with arrows |
| Deployment in guides but Authorization partly in docs | Move authorization page to guides/deployment too |
| Auth0 stays in docs but authorization concept moves | Auth0 is an integration, not a deployment guide — it stays in docs under Authorization |

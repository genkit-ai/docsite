# Genkit Documentation Guidance

This guide defines how to author and maintain docs in the current language-aware architecture.

## Terminology

Use **Genkit** as the product name. Do not use "Firebase Genkit" in docs content.

## Quick Authoring Checklist

For every doc page:

1. Keep a single source file under `src/content/docs/docs/`.
2. Set frontmatter `supportedLanguages`.
3. Set `isLanguageAgnostic: true` only if the page should have one shared canonical URL.
4. Use `<Lang>` only for language-specific deltas.
5. Keep shared prose outside `<Lang>` blocks.
6. Prefer neutral prose first. Use `<Lang terms={...}>` when only small language-specific tokens differ.
7. Author internal docs links as neutral routes (`/docs/<slug>/`) unless intentionally language-pinned.

## Required Frontmatter

All docs pages should declare language support explicitly:

```mdx
---
title: Example Page
description: What this page covers.
supportedLanguages: [js, go, python]
---
```

Optional for fully shared pages:

```mdx
---
title: Feedback
description: How to send feedback.
supportedLanguages: [js, go, dart, python]
isLanguageAgnostic: true
---
```

## Language-Specific Content

Use the `Lang` component for content differences.

```mdx
import Lang from '../../../components/Lang.astro';

Common setup steps for all languages.

<Lang lang="js go">{/* JavaScript and Go-specific pattern notes */}</Lang>

<Lang lang="python">{/* Python-specific details */}</Lang>
```

Rules:

1. `lang` accepts one or more values from `js`, `go`, `dart`, `python`.
2. Only include languages also declared in `supportedLanguages`.
3. Do not wrap entire pages in `Lang` unless every section is truly language-specific.
4. Do not use legacy `LanguageContent`.

## Language Terms for Minor Deltas

Use `<Lang terms={...}>` when prose is mostly the same and only a few terms differ by language.

```mdx
import Lang from '../../../components/Lang.astro';

<Lang lang="js go python dart" terms={{
  "schemaLibraryName": {
    "js": "Zod",
    "go": "Go structs",
    "python": "Pydantic Models",
    "dart": "Schematic"
  }
}}>
- Define schemas with [[schemaLibraryName]].
</Lang>
```

Rules:

1. Keep page-level variables in the page where they are used.
2. `terms` must be a JSON object literal (quoted keys/values).
3. Use global variables only for cross-doc constants, defined in `src/content/docs/_shared/global-terms.ts`.
4. Global token syntax is `[[@global.path.to.value]]` (example: `[[@global.models.geminiFlash]]`).
5. Resolution order is `page` then `global`; unresolved tokens produce generation warnings.

## Page Type Rules

### Language-Variant Pages

Use this for pages with language-specific implementation details.

- Canonical URLs are `/docs/{lang}/{slug}`.
- Neutral `/docs/{slug}` is a redirect/dispatcher URL.
- Sidebar visibility depends on selected language and `supportedLanguages`.

### Language-Agnostic Pages

Use `isLanguageAgnostic: true` when content is truly shared.

- Canonical URL is `/docs/{slug}`.
- Do not author language-specific duplicates.
- Page stays visible in sidebar for all language selections.

## Sidebar and Selector Behavior

- Language selector is global (top of left docs nav).
- Sidebar is filtered to pages supporting the selected language.
- On language switch, if current page is unavailable in the selected language, navigation falls back to a valid page in that language.
- Fallback priority for redirects is: `js > go > dart > python`.

Author impact: if a page should appear for a language, include that language in `supportedLanguages`.

## Internal Docs Links

Author links in source docs as neutral docs routes:

- Preferred: `/docs/flows/`
- Avoid in source docs: `/docs/js/flows/`, `/docs/go/flows/` (unless intentionally language-pinned)

Why:

1. Build/runtime rewrite resolves links to the active language variant when available.
2. If a target is unsupported in the active language, links resolve to the canonical fallback language.
3. Language-agnostic pages remain neutral (`/docs/<slug>/`).
4. Copy-as-markdown and `llms-*.txt` outputs use the same rewrite behavior.

### Cross-language link warnings

Generation emits non-blocking warnings when a language page must link to another language variant (for example, Go page linking to a JS-only target). These warnings help identify missing language coverage but do not fail the build.

### Duplication and template warnings

Generation also emits non-blocking warnings for:

- high-similarity sibling `<Lang>` prose blocks (suggesting neutral prose or `<Lang terms={...}>`)
- `<Lang>` terms missing per-language values for the block's declared `lang` set
- unresolved `[[...]]` template tokens in rendered language output

## Writing Standards

### Clarity

- Prefer direct language over theory-heavy explanations.
- Explain "why" briefly, then show working examples.

### Consistency

- Keep parallel section structure across languages.
- Use the same terminology and concept names across pages.
- If sibling language prose is near-identical, merge to neutral prose or `<Lang terms={...}>`.

### Code Examples

- Must be runnable/copyable with minimal edits.
- Keep examples aligned across languages where possible.
- Prefer current recommended models and packages.

### Cross-Linking

- Link related docs on first relevant mention.
- Add a short "Learn more" section when useful.

### Feature Gaps

- Never fabricate unsupported functionality.
- If unsupported in a language, include clear notes and alternatives.

## Callouts

Supported Starlight callout blocks:

- `:::note`
- `:::tip`
- `:::caution`
- `:::danger`

Use callouts sparingly for high-signal information.

## Copy As Markdown

Pages include a "Copy as Markdown" action in the page title area. Keep heading structure clean and avoid unnecessary wrapper markup so copied output remains readable.
Generated-file warning comments are removed from markdown export/copy output.

## Validation Before PR

Run from repo root:

1. `pnpm generate-language-pages`
2. `pnpm build-bundle`
3. `pnpm build-llms-direct`
4. `pnpm build`

Generated language pages and generated llms output are build artifacts and are ignored by git.

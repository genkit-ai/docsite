# Genkit.dev Docsite

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

## Overview

This repository powers the Genkit documentation site using Astro + Starlight.

Current language architecture:

1. Source docs are authored once per topic in `src/content/docs/docs/**/*.mdx`.
2. Language-specific content inside a page uses `<Lang lang="...">...</Lang>`.
3. Supported languages per page are declared in frontmatter using `supportedLanguages`.
4. Language-specific route files are generated into `src/content/docs/docs/{js,go,dart,python}/...`.
5. Canonical language routes use `/docs/{lang}/{slug}/` for language-variant pages.

## Key Directories

```
.
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   │   └── docs/
│   │       └── docs/               # source + generated language pages
│   ├── scripts/
│   │   └── generate-language-pages.ts
│   └── content.config.ts
├── astro.config.mjs
└── package.json
```

## Writing Docs

For each docs page:

1. Keep one source file in `src/content/docs/docs/`.
2. Add frontmatter:
    - `supportedLanguages: [js, go, dart, python]` (subset allowed)
    - optional `isLanguageAgnostic: true` for shared pages
3. Use `<Lang>` blocks only where content differs by language.
4. Keep common content outside language blocks.

See [DOCUMENTATION-GUIDANCE.md](DOCUMENTATION-GUIDANCE.md) for full authoring standards.

## Commands

All commands run from repo root:

| Command                        | Action                                                                 |
| :----------------------------- | :--------------------------------------------------------------------- |
| `pnpm install`                 | Install dependencies                                                   |
| `pnpm generate-language-pages` | Generate `/docs/{lang}/...` content files from unified source docs     |
| `pnpm dev`                     | Generate language pages and start local dev server                     |
| `pnpm build`                   | Generate language pages, build docs bundles/llms files, and build site |
| `pnpm preview`                 | Preview the production build                                           |
| `pnpm build-llms-direct`       | Generate `llms*.txt` outputs directly from docs source                 |

## Contribution Notes

Before opening a PR:

1. Run `pnpm generate-language-pages`.
2. Run `pnpm build-bundle` and `pnpm build-llms-direct`.
3. Ensure docs routes load locally (`pnpm dev`).
4. Commit source docs and code changes only.
5. Do not commit generated language pages or generated llms artifacts (both are gitignored build artifacts).

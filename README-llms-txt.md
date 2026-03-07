# LLMs.txt Generation Guide

This repository generates language-aware `llms.txt` outputs directly from the unified docs source.

## Source Model

- Source docs live in `src/content/docs/docs/**/*.mdx`.
- Each page declares language availability in frontmatter:
    - `supportedLanguages: [js, go, dart, python]` (subset allowed)
    - optional `isLanguageAgnostic: true`
- Language deltas in body content use `<Lang lang="...">...</Lang>`.

## Outputs

Running `pnpm build-llms-direct` generates:

- `public/llms.txt` (index)
- `public/llms-full.txt` (unfiltered aggregate)
- `public/llms-js.txt`
- `public/llms-go.txt`
- `public/llms-dart.txt`
- `public/llms-python.txt`
- `public/_llms-txt/*.txt` thematic sets per language

These files are build artifacts and are gitignored.

## Routing and Canonical URL Rules

`llms` outputs must align with the docs routing model:

- Language-variant pages reference canonical URLs as `/docs/{lang}/{slug}`.
- Language-agnostic pages reference canonical URLs as `/docs/{slug}`.
- Redirect-only/query-param variants are not emitted.

Source docs should use neutral internal docs links (`/docs/<slug>/`). During generation, links are rewritten per output language:

- supported target in active language -> `/docs/{lang}/{slug}/`
- unsupported target in active language -> canonical fallback language path
- language-agnostic target -> neutral `/docs/{slug}/`

## Filtering Behavior

The generator applies the same language rules used by docs navigation and routing:

1. Parse frontmatter for `supportedLanguages` and `isLanguageAgnostic`.
2. Process MDX content with `<Lang>` block filtering per language.
3. Include shared content in all language outputs.
4. Exclude pages where a language is not supported.
5. Include agnostic pages in all language-specific outputs.

## Commands

- `pnpm build-llms-direct`: generate LLM text files only
- `pnpm build`: full production build (includes llms generation)

## Contributor Notes

When updating docs or language metadata:

1. Run `pnpm generate-language-pages`.
2. Run `pnpm build-llms-direct`.
3. Run `pnpm build` before opening a PR.
4. Do not commit generated language pages or generated `public/llms*.txt` files.

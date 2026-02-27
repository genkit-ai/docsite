---
trigger: always_on
---

# Genkit Docsite Agent Guide

This repository contains the documentation site for Genkit, built with [Astro Starlight](https://starlight.astro.build/).

## Key Locations

- **Content**: `src/content/docs/docs/` contains the main documentation pages (`.mdx`).
- **Components**: `src/components/` contains custom Astro components.
- **Custom Head**: `src/content/custom/head.astro` contains the core logic for the language switching system (inline JS and CSS).
- **Configuration**: `astro.config.mjs` configures Starlight and integrations.
- **Scripts**: `src/gen-bundle.ts` and others are used during the build process to generate API references or bundles.

## Language System

The site features a custom multi-language selector (JavaScript, Go, Python) that toggles content visibility without page reloads.

### Components

1.  **`<LanguageSelector />`**
    *   **Location**: `src/components/LanguageSelector.astro`
    *   **Usage**: Placed at the top of pages (usually via MDX).
    *   **Props**:
        *   `supportedLanguages`: Space-separated string or array of languages to show (e.g., `"js go"`). Defaults to `['js', 'go', 'python']`. Useful when a page only has content for specific languages.
    *   **Function**: Renders buttons/tabs to switch the active language.
    *   **Behavior**: Updates the URL query parameter (`?lang=x`), local storage, and the `data-genkit-lang` attribute on the `<html>` tag.

2.  **`<LanguageContent lang="...">`**
    *   **Location**: `src/components/LanguageContent.astro`
    *   **Usage**: Wraps content specific to one or more languages.
    *   **Props**:
        *   `lang`: Space-separated string of languages (e.g., `"js"`, `"go"`, `"js go"`, `"python"`).
    *   **Behavior**: Renders a `div` with `data-lang` attribute.

### How it Works

*   **Logic**: `src/content/custom/head.astro` contains the `UnifiedPageManager` class (inline script) which handles state management (URL, localStorage) and updates the `data-genkit-lang` attribute on the `<html>` element.
*   **Styling**: Critical CSS in `head.astro` handles visibility:
    *   `.lang-content` is hidden by default.
    *   Specific CSS rules show the content based on the match between `html[data-genkit-lang]` and `.lang-content[data-lang]`.
    *   It uses the `~=` attribute selector to support multi-language blocks (e.g., `data-lang="js go"` matches both `js` and `go` selectors).

### Example Usage

```mdx
import LanguageSelector from '../../../components/LanguageSelector.astro';
import LanguageContent from '../../../components/LanguageContent.astro';

<LanguageSelector />

<LanguageContent lang="js">
  // Content visible only when JavaScript is selected
</LanguageContent>

<LanguageContent lang="go">
  // Content visible only when Go is selected
</LanguageContent>

<LanguageContent lang="js go">
  // Content visible for BOTH JavaScript and Go
</LanguageContent>
```

## Development

- **Install Dependencies**: `pnpm install`
- **Start Dev Server**: `pnpm dev` (runs `astro dev`)
- **Build**: `pnpm build` (runs bundle generation scripts and then `astro build`)
- **Format**: `pnpm format` (uses Prettier)

## Notes

- The site uses **Tailwind CSS** for styling (via Starlight integration and custom CSS).
- Content is written in **MDX**, allowing standard Markdown mixed with Astro/React components.
- API references are likely generated/updated via the `build-bundle` scripts, so be aware of generated content.

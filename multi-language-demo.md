# Multi-Language LanguageContent Component Demo

This demonstrates the enhanced LanguageContent component that now supports multiple languages in a single block.

## What's New

The LanguageContent component now accepts space-separated languages in the `lang` prop:

```astro
<!-- Single language (existing behavior) -->
<LanguageContent lang="js">
  JavaScript-only content
</LanguageContent>

<!-- Multiple languages (new feature) -->
<LanguageContent lang="js go">
  Content shared between JavaScript and Go
</LanguageContent>

<!-- All languages -->
<LanguageContent lang="js go python">
  Content that applies to all languages
</LanguageContent>
```

## Implementation Details

### Component Changes
- **LanguageContent.astro**: Now parses space-separated languages and creates `data-lang="js go"` attributes
- **head.astro CSS**: Updated to use `~=` selector to match any language in the space-separated list

### CSS Selectors
The CSS now uses the `~=` attribute selector which matches space-separated values:

```css
/* Old: exact match only */
html[data-genkit-lang="js"] .lang-content[data-lang="js"]

/* New: matches any language in space-separated list */
html[data-genkit-lang="js"] .lang-content[data-lang~="js"]
```

## Example Usage Scenarios

### Scenario 1: Shared Installation Steps
```astro
<LanguageContent lang="js go">
Both JavaScript and Go use npm/yarn for package management:

```bash
npm install @genkit-ai/core
```
</LanguageContent>

<LanguageContent lang="python">
Python uses pip:

```bash
pip install genkit
```
</LanguageContent>
```

### Scenario 2: Similar API Patterns
```astro
<LanguageContent lang="js go">
Both JavaScript and Go use similar function-based APIs for defining flows.
</LanguageContent>

<LanguageContent lang="python">
Python uses a more class-based approach for defining flows.
</LanguageContent>
```

### Scenario 3: Common Concepts
```astro
<LanguageContent lang="js go python">
All languages support the core Genkit concepts of flows, prompts, and models.
</LanguageContent>

<LanguageContent lang="js go">
JavaScript and Go have additional support for middleware patterns.
</LanguageContent>

<LanguageContent lang="python">
Python has unique integration with popular ML libraries like scikit-learn.
</LanguageContent>
```

## Benefits

✅ **Reduces Duplication**: No need to repeat identical content for multiple languages
✅ **Easier Maintenance**: Update shared content in one place
✅ **Better Organization**: Clearly shows what's common vs. language-specific
✅ **Backward Compatible**: Existing single-language blocks continue working
✅ **Flexible**: Can mix single and multi-language blocks on the same page

## Technical Notes

- Languages are parsed by splitting on whitespace: `"js go python".split(/\s+/)`
- The `data-lang` attribute contains all specified languages: `data-lang="js go python"`
- CSS uses `[data-lang~="js"]` to match any occurrence of "js" in the space-separated list
- Works with the existing language preference and fallback system

This enhancement makes it much easier to create unified documentation that efficiently handles content shared between multiple languages while still supporting language-specific sections.

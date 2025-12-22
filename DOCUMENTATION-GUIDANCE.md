# Genkit Documentation Writing Guide

This guide provides comprehensive best practices for writing clear, effective, and maintainable documentation for Genkit. Following these principles ensures a consistent, high-quality experience for developers across all supported languages (JavaScript, Go, and Python).

## Terminology

**Important:** Always refer to the project as **Genkit**, never "Firebase Genkit". The proper name is simply **Genkit**.

## Core Documentation Principles

### 1. **Clarity**

Write documentation that is immediately understandable to your target audience.

- **Use plain, concise language**: Avoid unnecessary complexity. Write as if explaining to a colleague.
- **Define technical terms**: When introducing jargon or acronyms, provide clear definitions on first use.
- **Write for your audience**: Consider the reader's experience level and adjust terminology accordingly.
- **Be direct**: Get to the point quickly. Developers value their time.

**❌ Don't do this:**
```mdx
The utilization of the aforementioned methodology facilitates the implementation of sophisticated AI-driven workflows.
```

**✅ Do this:**
```mdx
Use flows to organize your AI workflows.
```

### 2. **Consistency**

Maintain uniform style, format, and terminology across all documentation.

- **Standardize terminology**: Use the same terms for the same concepts throughout (e.g., always "flow" not sometimes "workflow").
- **Follow formatting conventions**: Apply consistent heading levels, code block styles, and list formatting.
- **Ensure cross-language consistency**: The user experience should be predictable whether viewing JavaScript, Go, or Python documentation.
- **Use style guides**: Adhere to established documentation patterns and conventions.

### 3. **Cross-Linking**

Create a well-connected documentation ecosystem through strategic linking.

- **Link on first mention**: The first time a document mentions a concept like flows, RAG, or tool-calling (outside of its primary documentation), link to the relevant page.
- **Provide context**: Help readers discover related information without leaving the current page.
- **Include "Learn More" sections**: Every documentation page should link to at least 5 other relevant documentation pages, either within the main content or in a dedicated section at the end.
- **Link to external resources**: When referencing general AI concepts or third-party tools, link to authoritative external documentation.

**Example:**
```mdx
Models can call [tools](./tool-calling.mdx) to interact with external systems and use [RAG](./rag.mdx) to incorporate relevant context.

## Learn More

- [Model Configuration](./models.mdx)
- [Evaluation](./evaluation.mdx)
- [Deployment Options](./deployment/any-platform.mdx)
```

### 4. **Code Samples**

Provide abundant, practical code examples that developers can immediately use.

- **Make code copy-pasteable**: Ensure examples work as-is without modification.
- **Include comments**: Explain what the code does inline, especially for complex operations.
- **Show expected output**: Include comments or snippets demonstrating what the code produces.
- **Prefer code over prose**: When explaining how to do something, a well-commented code example is often clearer than paragraphs of text.
- **Use recommended models**: Default to using the Google GenAI package with recommended models (see "Default Models and Packages" section below).
- **Explain lengthier code samples**: After presenting a substantial code example, follow it with a bulleted explanation of what the code does. This helps readers understand the key concepts without having to parse the entire code block.

**✅ Good code sample with explanation:**
```typescript
import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

const RecipeSchema = z.object({
  title: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
});

export const recipeGeneratorFlow = ai.defineFlow(
  {
    name: 'recipeGeneratorFlow',
    inputSchema: z.object({ ingredient: z.string() }),
    outputSchema: RecipeSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Create a recipe using ${input.ingredient}`,
      output: { schema: RecipeSchema },
    });
    
    if (!output) throw new Error('Failed to generate recipe');
    return output;
  }
);
```

This code sample:

- Defines reusable input and output schemas with [Zod](https://zod.dev/)
- Configures the `gemini-2.5-flash` model as the default
- Defines a Genkit flow to generate a structured recipe based on your input
- Validates the output against the schema before returning it

### 5. **Cross-Language Alignment**

Ensure consistency across JavaScript, Go, and Python documentation.

- **Align examples**: Where possible, use the same use case, input/output schemas, and expected results across all three languages.
- **Maintain parallel structure**: If the JavaScript docs explain a concept in three steps, the Go and Python docs should follow the same structure.
- **Synchronize updates**: When updating documentation for one language, consider whether the same updates apply to others.
- **Highlight differences intentionally**: When languages differ, make it clear why and what the implications are.

**Example of aligned code samples:**

JavaScript:
```typescript
import { googleAI } from '@genkit-ai/google-genai';

const result = await ai.generate({
  model: googleAI.model('gemini-2.5-flash'),
  prompt: 'Explain quantum computing',
});
// Output: "Quantum computing uses quantum mechanics..."
```

Go:
```go
result, err := ai.Generate(ctx, g,
  ai.WithModelName("googleai/gemini-2.5-flash"),
  ai.WithPrompt("Explain quantum computing"),
)
// Output: "Quantum computing uses quantum mechanics..."
```

Python:
```python
result = await ai.generate(
    model='googleai/gemini-2.5-flash',
    prompt="Explain quantum computing"
)
# Output: "Quantum computing uses quantum mechanics..."
```

### 6. **Anticipate Questions**

Address potential confusion before it arises.

- **Document edge cases**: Explain what happens in unusual scenarios.
- **Highlight common pitfalls**: Warn about frequent mistakes and how to avoid them.
- **Explain the "why"**: Don't just show how to do something—explain when and why you'd use it.
- **Address limitations**: Be upfront about what features don't support or known issues.
- **Include troubleshooting**: Provide solutions to common problems.
- **Use callouts effectively**: Astro Starlight supports several callout types to highlight important information.

**Available Callout Types:**

Astro Starlight provides these callout types (use the one that best fits your message):

- `:::note` - General information or neutral notes
- `:::tip` - Helpful suggestions or best practices
- `:::caution` - Important warnings about potential issues
- `:::danger` - Critical warnings about serious problems

**Examples:**

```mdx
:::caution[Common Pitfall]
When defining input schemas, ensure all required fields are marked explicitly. Optional fields should use `.optional()` in Zod (JavaScript) or `Optional[]` in Go. Forgetting this can cause runtime validation errors.
:::

:::tip[Best Practice]
Use descriptive field names in your schemas with `.describe()` to help the model understand what data to generate.
:::

:::note[Feature unavailable for Python]
Dotprompt is not yet available for Python. For prompt management, consider using string templates or the standard prompt format.
:::

:::danger[Breaking Change]
This feature requires Genkit v0.9 or later. Earlier versions are not compatible.
:::
```

### 7. **Conceptual Explanations**

Keep explanations of non-Genkit concepts brief and focused.

- **Link to Google Search AI mode**: For general AI concepts (like RAG, embeddings, or MCP), provide a brief explanation and link to Google Search AI mode for comprehensive information.
- **Focus on Genkit-specific aspects**: Spend documentation space on how Genkit implements or uses the concept, not on the concept itself.
- **Avoid redundancy**: Don't duplicate information that's better explained elsewhere.

**❌ Don't do this:**
```mdx
## What is Retrieval-Augmented Generation?

Retrieval-Augmented Generation (RAG) is a technique in natural language processing that combines the power of large language models with external knowledge retrieval. The process works by first retrieving relevant documents from a knowledge base, then using those documents as context for the language model to generate more accurate and informed responses. This approach was first introduced in the paper "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" by Lewis et al. in 2020...

[3 more paragraphs about RAG theory]
```

**✅ Do this:**
```mdx
## Retrieval-Augmented Generation in Genkit

[Retrieval-Augmented Generation (RAG)](https://www.google.com/search?q=What%20is%20retrieval%20augmented%20generation%3F&udm=50) enhances LLM responses by incorporating relevant information from external knowledge sources. Genkit provides built-in support for RAG workflows through indexers and retrievers.
```

**Note on External Links:**
When linking to general AI concepts, use Google Search AI mode links with the format:
```
https://www.google.com/search?q=Your%20Question%20Here&udm=50
```
This provides users with AI-powered search results that explain the concept comprehensively.

### 8. **Cross-Language Feature Gaps**

Handle documentation for features not available in all languages carefully.

- **Never fabricate content**: Only document features that actually exist and are verified.
- **Use reliable sources**: Base documentation on official Genkit source code from the [Genkit GitHub repository](https://github.com/firebase/genkit) or other verified documentation pages in this project.
- **Provide alternatives when possible**: If a feature isn't available in one language, suggest workarounds or equivalent approaches.

**Example:**
```mdx
<LanguageContent lang="python">
:::note[Feature unavailable for Python]
Dotprompt is not yet available for Python. For prompt management, consider using string templates or the standard prompt format.
:::
</LanguageContent>
```

## Default Models and Packages

When writing code examples and documentation, use the **Google GenAI package** (`@genkit-ai/google-genai`) as the default provider unless there's a specific reason to use another provider.

**Note:** This guidance applies to general documentation and examples. When writing documentation specifically for other model providers (such as the OpenAI, xAI, Anthropic, or Ollama integration pages), use the appropriate provider's package and models for that documentation.

### Recommended Models by Use Case

Use these models in your documentation examples:

- **Text generation**: `gemini-2.5-flash`
- **Video generation**: `veo-3.0-generate-001`
- **Pure image generation**: `imagen-4.0-generate-001`
- **Image editing, style transfer, text rendering**: `gemini-2.5-flash-image`

### How to Reference Models

**Always use the current model reference syntax**, not deprecated constant values:

**✅ Correct (current syntax):**

JavaScript:
```typescript
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'), // Using model reference function
});

// Or with string identifier
const response = await ai.generate({
  model: 'googleai/gemini-2.5-flash',
  prompt: 'Your prompt here',
});
```

Go:
```go
import "github.com/firebase/genkit/go/plugins/googlegenai"

g := genkit.Init(ctx,
  genkit.WithPlugins(&googlegenai.GoogleAI{}),
  genkit.WithDefaultModel("googleai/gemini-2.5-flash"),
)
```

Python:
```python
from genkit.plugins.google_genai import GoogleAI

ai = Genkit(
    plugins=[GoogleAI()],
    model='googleai/gemini-2.5-flash',
)
```

**❌ Incorrect (deprecated constant syntax):**
```typescript
import { gemini15Flash } from '@genkit-ai/google-genai';

// Don't use old constant values - these may not be maintained
const ai = genkit({
  model: gemini15Flash,
});
```

### Model Reference Best Practices

1. **Use model reference functions** when available (e.g., `googleAI.model('gemini-2.5-flash')`) for better type safety
2. **Use string identifiers** (e.g., `'googleai/gemini-2.5-flash'`) when model reference functions aren't available or for simplicity
3. **Keep examples up-to-date**: Always reference the latest recommended models in documentation
4. **Check the source**: Refer to [`src/content/docs/docs/models.mdx`](src/content/docs/docs/models.mdx) for the most current model reference patterns

## Flow Documentation Best Practices

Flows are a core Genkit concept and will appear in most documentation. Follow these best practices when documenting flows:

### 1. **Use Object-Based Schemas**

Always wrap input and output schemas in objects, even for simple types. This is a best practice across all languages.

**Why object-based schemas:**
- **Better developer experience**: Provides labeled input fields in the Developer UI
- **Future-proof API design**: Allows adding new fields without breaking existing clients
- **Consistency**: Maintains uniform patterns across all documentation

**✅ Correct:**
```typescript
// JavaScript
export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.object({ theme: z.string() }),
    outputSchema: z.object({ menuItem: z.string() }),
  },
  async ({ theme }) => {
    // ...
  }
);
```

```go
// Go
type MenuSuggestionInput struct {
    Theme string `json:"theme"`
}

type MenuSuggestionOutput struct {
    MenuItem string `json:"menuItem"`
}
```

```python
# Python
class MenuSuggestionInput(BaseModel):
    theme: str = Field(description='Restaurant theme')

class MenuSuggestionOutput(BaseModel):
    menu_item: str = Field(description='Generated menu item')
```

**❌ Incorrect:**
```typescript
// Don't use primitive types directly
export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),  // ❌ Not wrapped in object
    outputSchema: z.string(), // ❌ Not wrapped in object
  },
  async (theme) => {
    // ...
  }
);
```

### 2. **Use Descriptive Field Names with Descriptions**

For Python and JavaScript, add descriptions to schema fields to help both developers and models understand the data:

```python
class MenuSuggestionInput(BaseModel):
    theme: str = Field(description='Restaurant theme')

class MenuItemSchema(BaseModel):
    dishname: str = Field(description='Name of the dish')
    description: str = Field(description='Description of the dish')
```

```typescript
const MenuItemSchema = z.object({
  dishname: z.string().describe('Name of the dish'),
  description: z.string().describe('Description of the dish'),
});
```

### 3. **Consistent Naming Conventions**

Follow language-specific naming conventions:
- **JavaScript**: camelCase for flow names (`menuSuggestionFlow`)
- **Go**: PascalCase for types, camelCase for flow variables (`menuSuggestionFlow`)
- **Python**: snake_case for flow names (`menu_suggestion_flow`)

## Multi-Language Documentation with LanguageContent

The `LanguageContent` component allows you to show or hide content based on the user's selected programming language. Proper use minimizes duplication and makes documentation easier to maintain.

### Basic Principles

#### 1. **Maximize Common Content**

Place content outside `LanguageContent` blocks whenever possible. Content that applies to all languages should never be wrapped.

**❌ Don't do this:**
```mdx
<LanguageContent lang="js go python">

Flows are a core concept in Genkit that help you organize AI workflows.

</LanguageContent>
```

**✅ Do this:**
```mdx
Flows are a core concept in Genkit that help you organize AI workflows.
```

#### 2. **Use Multi-Language Blocks for Shared Content**

When content applies to 2 out of 3 languages, use the multi-language syntax instead of duplicating blocks.

**❌ Don't do this:**
```mdx
<LanguageContent lang="js">

The argument must conform to the input schema, if you defined one.

</LanguageContent>

<LanguageContent lang="python">

The argument must conform to the input schema, if you defined one.

</LanguageContent>

<LanguageContent lang="go">

The argument must conform to the input schema.

</LanguageContent>
```

**✅ Do this:**
```mdx
<LanguageContent lang="js python">

The argument must conform to the input schema, if you defined one.

</LanguageContent>

<LanguageContent lang="go">

The argument must conform to the input schema.

</LanguageContent>
```

#### 3. **Rewrite Minor Differences**

When differences between languages are minor and inconsequential, rewrite to create a single universal statement. For example, the phrase "if you defined one" is often implied and can be removed for cleaner documentation.

#### 4. **Avoid Language-Specific References in Common Content**

When possible, use generic terms instead of language-specific API names in shared content.

**❌ Don't do this:**
```mdx
<LanguageContent lang="js">

Just by wrapping your `generate()` calls like this...

</LanguageContent>

<LanguageContent lang="go">

Just by wrapping your `genkit.Generate()` calls like this...

</LanguageContent>

<LanguageContent lang="python">

Just by wrapping your `generate()` calls like this...

</LanguageContent>
```

**✅ Do this:**
```mdx
Just by wrapping your generate calls like this...
```

### Pages Supporting Only 1 or 2 Languages

When a documentation page describes features that are only available for a subset of languages (e.g., only JavaScript and Go, but not Python), you must follow a specific pattern to ensure proper display and user experience.

#### Required Components

1. **LanguageSelector with supportedLanguages**: Specify which languages are supported
2. **Unavailability notice**: Add a note for unsupported languages
3. **Wrap all content**: Enclose all main content in a LanguageContent block for supported languages

#### Complete Pattern

Here's the complete pattern for a page that only supports JavaScript and Go:

```mdx
---
title: Your Page Title
description: Your description mentioning supported languages
---

import LanguageSelector from '../../../components/LanguageSelector.astro';
import CopyMarkdownButton from '../../../components/CopyMarkdownButton.astro';
import LanguageContent from '../../../components/LanguageContent.astro';

<div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin: 1rem 0 1rem 0;">
  <LanguageSelector supportedLanguages="js go" />
  <CopyMarkdownButton />
</div>

<LanguageContent lang="python">
  :::note[Feature unavailable for Python]
The features described in this document are not yet available for Python.
:::
</LanguageContent>

<LanguageContent lang="js go">

All your main content goes here, wrapped in this LanguageContent block.

You can still use nested LanguageContent blocks within this wrapper for
language-specific variations:

<LanguageContent lang="js">
JavaScript-specific content
</LanguageContent>

<LanguageContent lang="go">
Go-specific content
</LanguageContent>

</LanguageContent>
```

#### Key Points

1. **LanguageSelector supportedLanguages**: When only 1 or 2 languages are supported, you MUST specify them in the `supportedLanguages` attribute (e.g., `supportedLanguages="js go"`). If all three languages are supported, omit this attribute entirely.

2. **Unavailability notice**: For each unsupported language, add a LanguageContent block with a clear note explaining that the features are not available. This should appear before the main content wrapper.

3. **Main content wrapper**: ALL content describing the feature must be wrapped in a LanguageContent block specifying the supported languages (e.g., `<LanguageContent lang="js go">`).

4. **Nested LanguageContent**: You can still use nested LanguageContent blocks within the main wrapper for language-specific variations between the supported languages.

#### Example: Two Languages Supported

For a feature available only in JavaScript and Go:

```mdx
<LanguageSelector supportedLanguages="js go" />

<LanguageContent lang="python">
:::note[Feature unavailable for Python]
The features described in this document are not yet available for Python.
:::
</LanguageContent>

<LanguageContent lang="js go">

## Feature Overview

This feature allows you to...

<LanguageContent lang="js">
```ts
// JavaScript example
const result = ai.someFeature();
```
</LanguageContent>

<LanguageContent lang="go">
```go
// Go example
result := genkit.SomeFeature()
```
</LanguageContent>

</LanguageContent>
```

#### Example: Single Language Supported

For a feature available only in JavaScript:

```mdx
<LanguageSelector supportedLanguages="js" />

<LanguageContent lang="go">
:::note[Feature unavailable for Go]
The features described in this document are not yet available for Go.
:::
</LanguageContent>

<LanguageContent lang="python">
:::note[Feature unavailable for Python]
The features described in this document are not yet available for Python.
:::
</LanguageContent>

<LanguageContent lang="js">

All JavaScript-specific content goes here...

</LanguageContent>
```

#### Reference Implementation

See [`src/content/docs/docs/dotprompt.mdx`](src/content/docs/docs/dotprompt.mdx) for a complete example of a page that only supports JavaScript and Go.

### When to Use LanguageContent

#### ✅ Always Use For:

1. **Code examples** - These are almost always language-specific
2. **API-specific syntax** - When you must reference specific function names or syntax
3. **Language-specific features** - Features that only exist in one or two languages
4. **Installation/setup instructions** - Package managers and setup differ by language

#### ❌ Never Use For:

1. **Conceptual explanations** - General concepts apply to all languages
2. **Benefits and features** - Unless the feature is language-specific
3. **Workflow descriptions** - The overall process is usually the same
4. **Examples and use cases** - Unless the example itself is language-specific

### Special Considerations for Bullet Lists

**Important:** LanguageContent tags render as block-level elements, which creates extra spacing when used within bullet lists. This breaks the visual flow of the list.

#### The Problem

When you wrap individual bullet items in LanguageContent tags, it creates unwanted spacing:

**❌ Don't do this:**
```mdx
- **Common feature**: Available in all languages
<LanguageContent lang="js">
- **JavaScript feature**: Only in JS
</LanguageContent>
<LanguageContent lang="python">
- **Python feature**: Only in Python
</LanguageContent>
- **Another common feature**: Available in all languages
```

This renders with extra spacing between bullets, breaking the list's visual continuity.

#### Solutions for Bullet Lists

##### Option 1: Rewrite to Be Language-Agnostic (Preferred)

The best solution is to rewrite bullet points to avoid language-specific content:

**✅ Do this:**
```mdx
- **Type safety**: Input and output schemas with runtime type checking
- **Integration with developer UI**: Debug flows independently
- **Simplified deployment**: Deploy as web API endpoints
```

##### Option 2: Wrap Entire List in LanguageContent

If language-specific bullets are valuable, wrap the **entire bullet list** in LanguageContent tags:

**✅ Do this:**
```mdx
<LanguageContent lang="js">

- **Type safety**: Input and output schemas defined using Zod
- **Integration with developer UI**: Debug flows independently
- **Simplified deployment**: Deploy as web API endpoints

</LanguageContent>

<LanguageContent lang="go">

- **Type safety**: Input and output schemas with static type checking
- **Integration with developer UI**: Debug flows independently
- **Simplified deployment**: Deploy as web API endpoints

</LanguageContent>

<LanguageContent lang="python">

- **Type safety**: Input and output schemas defined using Pydantic Models
- **Streaming**: Support for streaming data
- **Integration with developer UI**: Debug flows independently
- **Simplified deployment**: Deploy as web API endpoints

</LanguageContent>
```

#### Best Practices for Lists

1. **Prefer language-agnostic lists** - Rewrite to eliminate language-specific bullets when possible
2. **Wrap entire lists** - If you must have language-specific content, wrap the complete list for each language
3. **Never mix** - Don't mix wrapped and unwrapped bullets in the same list
4. **Consider alternatives** - Use paragraphs or other formatting if lists become too complex

### Multi-Language Syntax

The `lang` attribute accepts space-separated language codes:

```mdx
<LanguageContent lang="js">
JavaScript-only content
</LanguageContent>

<LanguageContent lang="js python">
Content for JavaScript and Python
</LanguageContent>

<LanguageContent lang="go python">
Content for Go and Python
</LanguageContent>

<LanguageContent lang="js go">
Content for JavaScript and Go
</LanguageContent>
```

**Note:** Never use `lang="js go python"` - this is equivalent to not wrapping the content at all.

### Language Ordering Convention

**Always order language-specific content blocks consistently throughout the documentation:**

#### Standard Order for All Three Languages

When you have separate blocks for each language, always use this order:

1. **JavaScript** (`lang="js"`)
2. **Go** (`lang="go"`)
3. **Python** (`lang="python"`)

**✅ Correct ordering:**
```mdx
<LanguageContent lang="js">
JavaScript code example
</LanguageContent>

<LanguageContent lang="go">
Go code example
</LanguageContent>

<LanguageContent lang="python">
Python code example
</LanguageContent>
```

**❌ Incorrect ordering:**
```mdx
<LanguageContent lang="python">
Python code example
</LanguageContent>

<LanguageContent lang="js">
JavaScript code example
</LanguageContent>

<LanguageContent lang="go">
Go code example
</LanguageContent>
```

#### Order for Two-Language Blocks

When content applies to only 2 languages, follow these ordering rules:

- **`js` always comes first** in multi-language blocks
- **`go` comes second** when paired with `js`
- **`python` comes last** when paired with either `js` or `go`

**✅ Correct two-language ordering:**
```mdx
<LanguageContent lang="js python">
Content for JavaScript and Python
</LanguageContent>

<LanguageContent lang="js go">
Content for JavaScript and Go
</LanguageContent>

<LanguageContent lang="go python">
Content for Go and Python
</LanguageContent>
```

**❌ Incorrect two-language ordering:**
```mdx
<LanguageContent lang="python js">
<!-- Wrong: js should come first -->
</LanguageContent>

<LanguageContent lang="go js">
<!-- Wrong: js should come first -->
</LanguageContent>

<LanguageContent lang="python go">
<!-- Wrong: go should come first -->
</LanguageContent>
```

#### Why Consistent Ordering Matters

1. **Maintainability** - Developers can quickly scan documentation knowing where to find each language
2. **Predictability** - Users switching between languages find content in expected locations
3. **Code review** - Easier to spot missing or misplaced language blocks
4. **Documentation quality** - Demonstrates attention to detail and professionalism

### Common Patterns

#### Pattern 1: Code Examples with Shared Explanation

```mdx
Here's how to define a flow:

<LanguageContent lang="js">

\`\`\`typescript
export const myFlow = ai.defineFlow(...)
\`\`\`

</LanguageContent>

<LanguageContent lang="go">

\`\`\`go
myFlow := genkit.DefineFlow(...)
\`\`\`

</LanguageContent>

<LanguageContent lang="python">

\`\`\`python
@ai.flow()
async def my_flow():
    ...
\`\`\`

</LanguageContent>

This creates a flow that can be run from the CLI or developer UI.
```

#### Pattern 2: Handling Language-Specific List Items

See the "Special Considerations for Bullet Lists" section above for detailed examples and best practices.

#### Pattern 3: CLI Commands

```mdx
Run a flow from the command line:

<LanguageContent lang="js python">

\`\`\`bash
genkit flow:run myFlow '{"input": "value"}'
\`\`\`

</LanguageContent>

<LanguageContent lang="go">

\`\`\`bash
genkit flow:run myFlow '"value"'
\`\`\`

</LanguageContent>
```

## Documentation Refactoring Checklist

When creating or refactoring documentation:

### Content Quality
1. ✅ **Clarity check** → Is the language clear and concise? Are technical terms defined?
2. ✅ **Code samples** → Are there sufficient, well-commented, copy-pasteable examples with expected output?
3. ✅ **Cross-linking** → Does the page link to at least 5 other relevant documentation pages?
4. ✅ **Anticipate questions** → Are edge cases, common pitfalls, and limitations documented?
5. ✅ **Conceptual explanations** → Are non-Genkit concepts kept brief with links to external resources?

### Multi-Language Support
6. ✅ **Check language support** → Determine if the page supports all 3 languages or only a subset
7. ✅ **For limited language support** → Add `supportedLanguages` to LanguageSelector, unavailability notices, and wrap all content
8. ✅ **Cross-language alignment** → Are examples aligned across languages with same inputs/outputs?
9. ✅ Identify all content that's identical across all languages → Move outside blocks
10. ✅ Find content shared by 2 languages → Use multi-language syntax (with proper ordering)
11. ✅ Look for minor differences that can be rewritten → Generalize the text
12. ✅ Check for language-specific API references → Consider using generic terms
13. ✅ Verify no `lang="js go python"` blocks exist → Remove the wrapper
14. ✅ Ensure code examples remain in language-specific blocks → Keep them wrapped
15. ✅ **Check bullet lists** → Either make them language-agnostic OR wrap entire lists per language
16. ✅ **Avoid mixing** → Never mix LanguageContent tags within a single bullet list
17. ✅ **Verify language ordering** → Ensure all blocks follow the standard order (JS, Go, Python)

### Consistency
18. ✅ **Terminology** → Is terminology consistent with other documentation pages?
19. ✅ **Formatting** → Do headings, lists, and code blocks follow established patterns?
20. ✅ **Style** → Does the tone and structure match other documentation?

## Quick Reference

### When in Doubt

1. Does this page support all 3 languages? → If not, use the limited language support pattern
2. Does this content apply to all languages? → Don't wrap it (unless the page has limited language support)
3. Does this content apply to 2 languages? → Use multi-language syntax (with proper ordering)
4. Is the difference minor and inconsequential? → Consider rewriting to consolidate
5. Is this a code example or API-specific? → Keep it language-specific
6. Is this a bullet list with language-specific items? → Wrap the entire list per language OR rewrite to be language-agnostic
7. Are language blocks in the right order? → Always use JS, Go, Python order
8. Have I included enough code samples? → Aim for at least one per major concept
9. Have I linked to related documentation? → Every page should link to at least 5 others
10. Is this concept Genkit-specific? → If not, keep explanation brief and link externally

### Maintenance Tips

- **Start with common content** - Write shared explanations first, then add language-specific details
- **Review regularly** - As APIs converge, consolidate more content
- **Test all languages** - Use the language selector to verify correct display
- **Keep it DRY** - Consolidate duplicated text across multiple blocks
- **Verify code samples** - Test that all examples actually work
- **Update cross-links** - When adding new pages, update related pages to link to them

### Examples

- **All languages supported**: See [`src/content/docs/docs/flows.mdx`](src/content/docs/docs/flows.mdx) for a well-structured example demonstrating these principles.
- **Limited language support**: See [`src/content/docs/docs/dotprompt.mdx`](src/content/docs/docs/dotprompt.mdx) for an example of a page supporting only JavaScript and Go.
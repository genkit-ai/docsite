# LanguageContent Component Usage Guide

This guide provides best practices for using the `LanguageContent` component in Genkit documentation to create efficient, maintainable multi-language documentation.

## Overview

The `LanguageContent` component allows you to show or hide content based on the user's selected programming language (JavaScript, Go, or Python). Proper use of this component minimizes duplication and makes documentation easier to maintain.

## Basic Principles

### 1. **Maximize Common Content**

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

### 2. **Use Multi-Language Blocks for Shared Content**

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

### 3. **Rewrite Minor Differences**

When differences between languages are minor and inconsequential, consider rewriting to create a single universal statement.

**❌ Don't do this:**
```mdx
<LanguageContent lang="js python">

The argument must conform to the input schema, if you defined one.

</LanguageContent>

<LanguageContent lang="go">

The argument must conform to the input schema.

</LanguageContent>
```

**✅ Do this:**
```mdx
The argument must conform to the input schema.
```

The phrase "if you defined one" is implied and doesn't add significant value, so removing it creates cleaner documentation.

### 4. **Avoid Language-Specific References in Common Content**

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

## When to Use LanguageContent

### ✅ Always Use For:

1. **Code examples** - These are almost always language-specific
2. **API-specific syntax** - When you must reference specific function names or syntax
3. **Language-specific features** - Features that only exist in one or two languages
4. **Installation/setup instructions** - Package managers and setup differ by language

### ❌ Never Use For:

1. **Conceptual explanations** - General concepts apply to all languages
2. **Benefits and features** - Unless the feature is language-specific
3. **Workflow descriptions** - The overall process is usually the same
4. **Examples and use cases** - Unless the example itself is language-specific

## Multi-Language Syntax

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

## Common Patterns

### Pattern 1: Code Examples with Shared Explanation

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

### Pattern 2: Mostly Common with Language-Specific Details

```mdx
Flows provide several benefits:

- **Type safety**: Input and output schemas with runtime type checking

<LanguageContent lang="js">

- **Zod integration**: Define schemas using Zod for TypeScript

</LanguageContent>

<LanguageContent lang="python">

- **Pydantic integration**: Define schemas using Pydantic models

</LanguageContent>

- **Developer UI integration**: Debug flows independently
- **Simplified deployment**: Deploy as web API endpoints
```

### Pattern 3: CLI Commands

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

## Refactoring Checklist

When refactoring existing documentation:

1. ✅ Identify all content that's identical across all languages → Move outside blocks
2. ✅ Find content shared by 2 languages → Use multi-language syntax
3. ✅ Look for minor differences that can be rewritten → Generalize the text
4. ✅ Check for language-specific API references → Consider using generic terms
5. ✅ Verify no `lang="js go python"` blocks exist → Remove the wrapper
6. ✅ Ensure code examples remain in language-specific blocks → Keep them wrapped

## Maintenance Tips

1. **Start with common content** - Write the shared explanation first, then add language-specific details
2. **Review regularly** - As APIs converge, more content can be consolidated
3. **Test all languages** - Use the language selector to verify content displays correctly
4. **Keep it DRY** - If you're copying the same text to multiple blocks, consider consolidating

## Examples from Real Documentation

See `src/content/docs/docs/flows.mdx` for a well-structured example that demonstrates:
- Common content outside blocks
- Multi-language blocks for shared content
- Minimal use of language-specific wrappers
- Generalized language where appropriate

## Questions?

When in doubt, ask:
1. Does this content apply to all languages? → Don't wrap it
2. Does this content apply to 2 languages? → Use multi-language syntax
3. Is the difference minor and inconsequential? → Consider rewriting to consolidate
4. Is this a code example or API-specific? → Keep it language-specific
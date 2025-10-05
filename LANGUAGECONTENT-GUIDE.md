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

When differences between languages are minor and inconsequential, rewrite to create a single universal statement. For example, the phrase "if you defined one" is often implied and can be removed for cleaner documentation.

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

## Special Considerations for Bullet Lists

**Important:** LanguageContent tags render as block-level elements, which creates extra spacing when used within bullet lists. This breaks the visual flow of the list.

### The Problem

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

### Solutions for Bullet Lists

#### Option 1: Rewrite to Be Language-Agnostic (Preferred)

The best solution is to rewrite bullet points to avoid language-specific content:

**✅ Do this:**
```mdx
- **Type safety**: Input and output schemas with runtime type checking
- **Integration with developer UI**: Debug flows independently
- **Simplified deployment**: Deploy as web API endpoints
```

#### Option 2: Wrap Entire List in LanguageContent

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

### Best Practices for Lists

1. **Prefer language-agnostic lists** - Rewrite to eliminate language-specific bullets when possible
2. **Wrap entire lists** - If you must have language-specific content, wrap the complete list for each language
3. **Never mix** - Don't mix wrapped and unwrapped bullets in the same list
4. **Consider alternatives** - Use paragraphs or other formatting if lists become too complex

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

## Language Ordering Convention

**Always order language-specific content blocks consistently throughout the documentation:**

### Standard Order for All Three Languages

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

### Order for Two-Language Blocks

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

### Why Consistent Ordering Matters

1. **Maintainability** - Developers can quickly scan documentation knowing where to find each language
2. **Predictability** - Users switching between languages find content in expected locations
3. **Code review** - Easier to spot missing or misplaced language blocks
4. **Documentation quality** - Demonstrates attention to detail and professionalism

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

### Pattern 2: Handling Language-Specific List Items

See the "Special Considerations for Bullet Lists" section above for detailed examples and best practices.

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
2. ✅ Find content shared by 2 languages → Use multi-language syntax (with proper ordering)
3. ✅ Look for minor differences that can be rewritten → Generalize the text
4. ✅ Check for language-specific API references → Consider using generic terms
5. ✅ Verify no `lang="js go python"` blocks exist → Remove the wrapper
6. ✅ Ensure code examples remain in language-specific blocks → Keep them wrapped
7. ✅ **Check bullet lists** → Either make them language-agnostic OR wrap entire lists per language
8. ✅ **Avoid mixing** → Never mix LanguageContent tags within a single bullet list
9. ✅ **Verify language ordering** → Ensure all blocks follow the standard order (JS, Go, Python)

## Quick Reference

### When in Doubt

1. Does this content apply to all languages? → Don't wrap it
2. Does this content apply to 2 languages? → Use multi-language syntax (with proper ordering)
3. Is the difference minor and inconsequential? → Consider rewriting to consolidate
4. Is this a code example or API-specific? → Keep it language-specific
5. Is this a bullet list with language-specific items? → Wrap the entire list per language OR rewrite to be language-agnostic
6. Are language blocks in the right order? → Always use JS, Go, Python order

### Maintenance Tips

- **Start with common content** - Write shared explanations first, then add language-specific details
- **Review regularly** - As APIs converge, consolidate more content
- **Test all languages** - Use the language selector to verify correct display
- **Keep it DRY** - Consolidate duplicated text across multiple blocks

### Example

See [`src/content/docs/docs/flows.mdx`](src/content/docs/docs/flows.mdx) for a well-structured example demonstrating these principles.
# Language-Aware LLMs.txt System for Genkit Documentation

This document explains the enhanced llms.txt system implemented for genkit.dev that provides language-specific documentation optimized for LLM consumption.

## Overview

The genkit.dev documentation site now generates multiple llms.txt files that filter content based on programming language (JavaScript, Go, Python) from the unified documentation structure. This allows LLMs to access focused, relevant content without language mixing.

## System Architecture

### 1. **Unified Documentation Source**
- All documentation is stored in `src/content/docs/unified-docs/`
- Uses `<LanguageContent lang="js|go|python">` components for language-specific sections
- Common content exists outside these components

### 2. **Processing Pipeline**
- **Astro Configuration**: Updated `starlightLlmsTxt` plugin to point to unified docs paths
- **Custom Processor**: `src/process-unified-llms.ts` handles language filtering and content cleaning
- **Build Integration**: Runs automatically during `pnpm build` process

### 3. **Generated Output Structure**

#### Main Files
- `/llms.txt` - Index file with links to all documentation sets
- `/llms-js.txt` - Complete JavaScript-focused documentation
- `/llms-go.txt` - Complete Go-focused documentation  
- `/llms-python.txt` - Complete Python-focused documentation

#### Language-Specific Thematic Sets
- `/_llms-txt/building-ai-workflows-{lang}.txt`
- `/_llms-txt/deploying-ai-workflows-{lang}.txt`
- `/_llms-txt/observing-ai-workflows-{lang}.txt`
- `/_llms-txt/writing-plugins-{lang}.txt`
- `/_llms-txt/ai-providers-{lang}.txt`

#### Language-Agnostic Sets
- `/_llms-txt/vector-databases.txt`
- `/_llms-txt/developer-tools.txt`

## Content Processing Features

### Language Filtering
- Extracts content from `<LanguageContent lang="js">` blocks for JavaScript files
- Extracts content from `<LanguageContent lang="go">` blocks for Go files
- Extracts content from `<LanguageContent lang="python">` blocks for Python files
- Includes common content (outside LanguageContent blocks) in all versions

### Content Cleaning
- Removes import statements (`import ...`)
- Removes React/Astro components (`<ComponentName>`)
- Removes Astro directives (`:::caution`, `:::note`, etc.)
- Removes LinkButton components
- Normalizes whitespace and line breaks

### Thematic Organization
Content is organized into logical groups:

1. **Building AI Workflows**: Core functionality, flows, prompts, tools
2. **Deploying AI Workflows**: Deployment guides and platform integration
3. **Observing AI Workflows**: Monitoring, observability, debugging
4. **Writing Plugins**: Plugin development and authoring
5. **AI Providers**: Model provider integrations
6. **Vector Databases**: Vector database integrations
7. **Developer Tools**: Development tools and local setup

## Implementation Details

### Key Files

#### `astro.config.mjs`
Updated `starlightLlmsTxt` configuration to:
- Point to unified-docs paths instead of language-specific paths
- Define comprehensive thematic sets
- Organize content by functionality rather than language

#### `src/process-unified-llms.ts`
Custom processor that:
- Scans all MDX files in `unified-docs/`
- Extracts and filters language-specific content
- Generates clean, LLM-optimized text files
- Creates both complete and thematic documentation sets

#### `package.json`
Updated build process:
```json
{
  "scripts": {
    "build": "pnpm build-bundle && pnpm build-unified-llms && astro build",
    "build-unified-llms": "tsx src/process-unified-llms.ts"
  }
}
```

### Content Processing Algorithm

1. **File Discovery**: Recursively find all `.mdx` files in unified-docs
2. **Frontmatter Extraction**: Parse YAML frontmatter for title/description
3. **Language Block Extraction**: Use regex to find `<LanguageContent>` blocks
4. **Content Separation**: Split content into language-specific and common sections
5. **Cleaning**: Remove web-specific components and formatting
6. **Generation**: Create language-filtered documentation files
7. **Thematic Grouping**: Generate focused sets by topic and language

## Benefits

### For LLMs
- **Focused Context**: No mixing of JavaScript, Go, and Python examples
- **Reduced Noise**: Clean text without web components
- **Thematic Access**: Targeted documentation for specific use cases
- **Consistent Format**: Standardized structure across all files

### For Developers
- **Single Source**: Unified docs maintain consistency
- **Automatic Updates**: llms.txt files stay in sync with main documentation
- **Language-Specific**: Developers get relevant examples for their language
- **Comprehensive Coverage**: Both complete and focused documentation sets

### For Maintenance
- **DRY Principle**: Single source of truth for all documentation
- **Automated Process**: No manual maintenance of llms.txt files
- **Extensible**: Easy to add new languages or thematic sets
- **Version Control**: All changes tracked in main documentation

## Usage Examples

### For JavaScript Developers
```
https://genkit.dev/llms-js.txt
https://genkit.dev/_llms-txt/building-ai-workflows-js.txt
```

### For Go Developers
```
https://genkit.dev/llms-go.txt
https://genkit.dev/_llms-txt/building-ai-workflows-go.txt
```

### For Python Developers
```
https://genkit.dev/llms-python.txt
https://genkit.dev/_llms-txt/building-ai-workflows-python.txt
```

### For Vector Database Integration
```
https://genkit.dev/_llms-txt/vector-databases.txt
```

## Development Workflow

### Adding New Content
1. Add content to appropriate unified-docs MDX file
2. Use `<LanguageContent lang="js|go|python">` for language-specific sections
3. Run `pnpm build-unified-llms` to regenerate files
4. Commit both source and generated files

### Adding New Languages
1. Update `LANGUAGE_SETS` in `src/process-unified-llms.ts`
2. Add language handling in `extractLanguageContent()`
3. Update main llms.txt template
4. Test generation process

### Adding New Thematic Sets
1. Define new set in `LANGUAGE_SETS` array
2. Specify relevant documentation paths
3. Regenerate files with `pnpm build-unified-llms`

## Monitoring and Quality

### Content Quality Checks
- Verify no web components leak through
- Ensure language filtering works correctly
- Check thematic grouping accuracy
- Validate generated file structure

### Performance Considerations
- Processing time scales with number of documentation files
- Generated files are static and cached
- Build process runs once per deployment

## Future Enhancements

### Potential Improvements
1. **Automatic Language Detection**: Infer language from code blocks
2. **Content Summarization**: Generate executive summaries
3. **Cross-References**: Maintain links between related topics
4. **Validation**: Automated checks for content quality
5. **Analytics**: Track which llms.txt files are most accessed

### Extensibility
- Support for additional programming languages
- Custom filtering rules per thematic set
- Integration with documentation analytics
- API for programmatic access to processed content

## Conclusion

This language-aware llms.txt system provides a sophisticated solution for making Genkit's unified documentation accessible to LLMs while maintaining the benefits of a single source of truth. The system automatically generates clean, focused documentation that serves both human developers and AI systems effectively.

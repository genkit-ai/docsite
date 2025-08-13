# Enhanced Language System Demo

This demonstrates the complete enhanced language support system with multi-language content blocks and intelligent redirect notices.

## New Features Implemented

### 1. Multi-Language LanguageContent Component
✅ **Space-separated languages**: `lang="js go"` for shared content
✅ **Backward compatible**: Existing single-language blocks still work
✅ **Flexible mixing**: Can combine single and multi-language blocks

### 2. Language Redirect Notice System
✅ **Automatic detection**: Shows when users are redirected from unsupported languages
✅ **Dynamic default notices**: Automatically generates notices with proper language names
✅ **Custom notices**: Language-specific custom messages take priority
✅ **Smart positioning**: Appears below language selector, above content
✅ **Starlight integration**: Uses native aside styling for consistency

## Usage Examples

### Multi-Language Content Blocks

```astro
<!-- Shared content for JavaScript and Go -->
<LanguageContent lang="js go">
Both JavaScript and Go use similar installation steps:

```bash
npm install @genkit-ai/core
```
</LanguageContent>

<!-- Python-specific alternative -->
<LanguageContent lang="python">
Python uses pip for installation:

```bash
pip install genkit
```
</LanguageContent>

<!-- Content for all languages -->
<LanguageContent lang="js go python">
All languages support the core Genkit concepts.
</LanguageContent>
```

### Redirect Notice Options

#### Default Notice (Automatic)
```markdown
{/* Default fallback notice for any unsupported language */}
<div id="language-redirect-notice-default" style="display: none;">
</div>
```
Shows: "Python unavailable. The features described in this document are unavailable for Python. Showing the documentation for JavaScript instead."

#### Custom Language-Specific Notices
```markdown
{/* Custom notice for Python users */}
<div id="language-redirect-notice-python" style="display: none;">

:::caution[Python unavailable]
Dotprompt is not available for Python. For Python prompt management, see the [Python Getting Started Guide](/python/docs/get-started) which covers prompt definition patterns.
:::

</div>

{/* Custom notice for Go users */}
<div id="language-redirect-notice-go" style="display: none;">

:::note[Go implementation]
The Go implementation of Dotprompt has some differences from JavaScript. See the [Go-specific documentation](/go/docs/dotprompt) for details.
:::

</div>

{/* Default fallback notice for any other unsupported language */}
<div id="language-redirect-notice-default" style="display: none;">
</div>
```

## Real-World Implementation

The Dotprompt page now demonstrates both features:

1. **Multi-language content blocks** reduce duplication between JS and Go
2. **Custom redirect notice** provides helpful guidance for Python users

### Before (Duplicated Content)
```astro
<LanguageContent lang="js">
The Dotprompt library expects to find your prompts in a directory...
</LanguageContent>

<LanguageContent lang="go">
The Dotprompt library expects to find your prompts in a directory...
</LanguageContent>
```

### After (Shared Content)
```astro
<LanguageContent lang="js go">
The Dotprompt library expects to find your prompts in a directory...
</LanguageContent>
```

## Technical Implementation

### Component Architecture
- **LanguageContent.astro**: Enhanced to parse space-separated languages
- **head.astro**: Updated JavaScript for redirect detection and dynamic notice generation
- **HTML containers**: Simple div containers with specific IDs for notice placement

### CSS Selectors
```css
/* Multi-language support using ~= selector */
html[data-genkit-lang="js"] .lang-content[data-lang~="js"] {
  display: block !important;
}
```

### JavaScript Logic
```javascript
// Dynamic notice generation with proper Starlight styling
showLanguageNotice(language, fallbackLanguage = 'JavaScript') {
  // Hide all notices first
  this.hideAllLanguageNotices();
  
  // Try to show custom notice for this language
  const specificNotice = document.getElementById(`language-redirect-notice-${language}`);
  if (specificNotice) {
    specificNotice.style.display = 'block';
    return;
  }
  
  // Generate default notice with dynamic content
  const defaultNotice = document.getElementById('language-redirect-notice-default');
  if (defaultNotice) {
    const languageLabels = { js: 'JavaScript', go: 'Go', python: 'Python' };
    const selectedLanguageLabel = languageLabels[language] || language;
    const fallbackLanguageLabel = languageLabels[fallbackLanguage] || fallbackLanguage;
    
    // Generate complete Starlight aside HTML
    const asideHTML = `
      <div class="starlight-aside starlight-aside--caution">
        <p class="starlight-aside__title" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
            <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v-2h2v2h-2zm0-4V8h2v4h-2z"/>
          </svg>
          ${selectedLanguageLabel} unavailable
        </p>
        <section class="starlight-aside__content">
          <p>The features described in this document are unavailable for ${selectedLanguageLabel}. Showing the documentation for ${fallbackLanguageLabel} instead.</p>
        </section>
      </div>
    `;
    
    defaultNotice.innerHTML = asideHTML;
    defaultNotice.style.display = 'block';
  }
}
```

## User Experience Flow

### Scenario: Python User Visits Dotprompt Page

1. **User has Python selected** as their preferred language
2. **Visits Dotprompt page** (supports only JS/Go)
3. **System detects incompatibility** and redirects to JavaScript
4. **Custom notice appears** with helpful message:
   > "Dotprompt is not available for Python. For Python prompt management, see the Python Getting Started Guide."
5. **User clicks link** to find relevant Python documentation
6. **Notice disappears** when visiting Python-supported pages

### Scenario: Content Author Benefits

1. **Writes shared content once** using `lang="js go"`
2. **Adds Python alternative** using `lang="python"`
3. **Provides custom notice** with helpful links
4. **Maintains easily** - updates shared content in one place

## Benefits Summary

### For Users
✅ **Clear communication** when redirected
✅ **Helpful guidance** to find relevant alternatives
✅ **Seamless experience** with automatic handling
✅ **No confusion** about why content changed

### For Content Authors
✅ **Reduced duplication** with multi-language blocks
✅ **Easier maintenance** of shared content
✅ **Flexible messaging** for different scenarios
✅ **Better organization** of language-specific vs shared content

### For Developers
✅ **Backward compatible** with existing content
✅ **Simple API** for both features
✅ **Extensible design** for future enhancements
✅ **Production ready** with proper error handling

## Advanced Usage Patterns

### Complex Page Structure
```astro
<!-- Page supports all languages -->
<LanguageSelector supportedLanguages={['js', 'go', 'python']} />

<!-- No redirect notice needed -->

<!-- Shared concepts -->
<LanguageContent lang="js go python">
All languages support flows, prompts, and models.
</LanguageContent>

<!-- Shared implementation -->
<LanguageContent lang="js go">
JavaScript and Go use similar function-based APIs.
</LanguageContent>

<!-- Language-specific details -->
<LanguageContent lang="python">
Python uses a more class-based approach.
</LanguageContent>
```

### Limited Support Page
```astro
<!-- Page supports only JS and Go - consistent space-delimited syntax -->
<LanguageSelector supportedLanguages="js go" />

<!-- Custom notice for Python users -->
<div id="language-redirect-notice-python" style="display: none;">

:::caution[Python unavailable]
This deployment guide focuses on Node.js. Python developers should see the <a href="/python/docs/deployment">Python Deployment Guide</a>.
:::

</div>

<!-- Default fallback notice for any other unsupported language -->
<div id="language-redirect-notice-default" style="display: none;">
</div>

<!-- Shared content -->
<LanguageContent lang="js go">
Both JavaScript and Go applications can be deployed to Cloud Run.
</LanguageContent>
```

## Consistent Syntax Across Components

Both LanguageSelector and LanguageContent now support the same space-delimited syntax for consistency:

### LanguageSelector Options
```astro
<!-- Array syntax (still supported) -->
<LanguageSelector supportedLanguages={['js', 'go']} />

<!-- Space-delimited syntax (new, recommended) -->
<LanguageSelector supportedLanguages="js go" />
```

### LanguageContent Options
```astro
<!-- Single language -->
<LanguageContent lang="js">JavaScript-only content</LanguageContent>

<!-- Multiple languages (space-delimited) -->
<LanguageContent lang="js go">Shared content</LanguageContent>
```

This consistent approach makes the API more intuitive and easier to use across the entire language support system.

This enhanced system provides a much better experience for both users and content authors while maintaining full backward compatibility with existing documentation.

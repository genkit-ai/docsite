# Custom Language Redirect Notice Demo

This demonstrates how to use the new Language Redirect Notice system with custom messages.

## How It Works

When a user visits a page that doesn't support their selected language, the system:

1. **Automatically redirects** to a supported language
2. **Shows a notice** above the content explaining what happened
3. **Allows custom messages** for specific pages that need special handling

## Default Behavior

By default, the notice shows:
> "The features described in this document are unavailable for [selected language], showing the documentation for [redirected language] instead."

For example, if a Python user visits the Dotprompt page (which only supports JS/Go), they'll see:
> "The features described in this document are unavailable for Python, showing the documentation for JavaScript instead."

## Custom Messages

Pages can provide custom messages to give users more helpful information:

### Example 1: Referring to Alternative Pages
```markdown
{/* Custom notice for Python users */}
<div id="language-redirect-notice-python" style="display: none;">

:::caution[Python unavailable]
Dotprompt is not available for Python. For Python prompt management, see the <a href="/python/docs/prompts">Python Prompts Guide</a>.
:::

</div>
```

### Example 2: Explaining Feature Differences
```markdown
{/* Custom notice for Python users */}
<div id="language-redirect-notice-python" style="display: none;">

:::caution[Python unavailable]
This deployment guide focuses on Node.js applications. Python developers should refer to the <a href="/python/docs/deployment">Python Deployment Guide</a> for Flask and FastAPI specific instructions.
:::

</div>
```

### Example 3: Roadmap Information
```markdown
{/* Custom notice for Go users */}
<div id="language-redirect-notice-go" style="display: none;">

:::note[Go support coming soon]
Go support for this feature is coming soon! Follow our <a href="https://github.com/firebase/genkit/issues">GitHub issues</a> for updates. In the meantime, the JavaScript implementation shown here demonstrates the core concepts.
:::

</div>
```

## Implementation Details

### Basic Usage
```markdown
{/* Default fallback notice for any unsupported language */}
<div id="language-redirect-notice-default" style="display: none;">
</div>

{/* Custom notice for specific language */}
<div id="language-redirect-notice-python" style="display: none;">

:::caution[Python unavailable]
Your custom message with <a href="/alternative">helpful links</a>.
:::

</div>
```

### JavaScript Integration
The notice is automatically shown/hidden by the UnifiedPageManager based on:
- User's selected language preference
- Page's supported languages (from LanguageSelector)
- Whether a redirect occurred

### Styling
The notice uses:
- Orange warning colors (light/dark mode compatible)
- Warning icon for visual clarity
- Responsive design that works on all screen sizes
- Proper contrast ratios for accessibility

## User Experience Flow

1. **User selects Python** as their preferred language
2. **Navigates to Dotprompt page** (supports only JS/Go)
3. **System automatically redirects** to JavaScript version
4. **Notice appears** explaining the redirect
5. **User can click links** in custom messages to find relevant alternatives
6. **Notice disappears** when user navigates to a page that supports Python

## Benefits

✅ **Clear Communication**: Users understand why they're seeing different content
✅ **Helpful Guidance**: Custom messages can direct users to relevant alternatives
✅ **Seamless Experience**: No manual intervention required
✅ **Flexible Messaging**: Each page can customize the message as needed
✅ **Accessible Design**: Proper ARIA labels and color contrast
✅ **Responsive**: Works on all device sizes

This enhancement makes the language support system much more user-friendly by clearly communicating what's happening and providing helpful guidance when features aren't available in a user's preferred language.

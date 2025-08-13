# Language Support System Demo

This demonstrates the new page-level language support system for Genkit documentation.

## What We've Implemented

### 1. Enhanced LanguageSelector Component
- Now accepts `supportedLanguages` prop
- Shows only supported languages for each page
- Displays helpful notice when languages are limited
- Example: `<LanguageSelector supportedLanguages={['js', 'go']} />`

### 2. Dual Preference System
The system now tracks:
- **Global Preference**: User's true preferred language (preserved across pages)
- **Current Language**: What's actually displayed (may be a fallback)

### 3. Smart Language Fallback
When navigating to pages with limited language support:
1. **Detects** supported languages from LanguageSelector component
2. **Checks** if current language is supported
3. **Redirects** to best available language if needed
4. **Preserves** user's global preference for future pages

## User Experience Flow

### Scenario: Dotprompt Page (JS + Go only)

1. **User has Python selected** on another page
2. **Navigates to Dotprompt** (`/unified-docs/dotprompt?lang=python`)
3. **System detects** Python not supported (only `['js', 'go']`)
4. **Automatic redirect** to `/unified-docs/dotprompt?lang=js`
5. **Language selector shows** only JS and Go pills
6. **Notice displays**: "Available in: JavaScript, Go"
7. **Global preference** remains Python for other pages

### Return to Full Support

1. **User navigates** to a page supporting all languages
2. **System detects** Python is supported again
3. **Automatically returns** to user's preferred Python
4. **Seamless experience** - preference preserved

## Technical Implementation

### Page-Level Configuration
```astro
<!-- In any .mdx file -->
<LanguageSelector supportedLanguages={['js', 'go']} />
```

### Automatic Detection
The unified page manager automatically:
- Detects supported languages from DOM
- Handles URL redirects
- Manages localStorage preferences
- Updates UI state

### Fallback Priority
1. User's global preference (if supported)
2. Current page language (if supported)  
3. JavaScript (if supported)
4. First available language

## Benefits

✅ **No more wrapping entire pages** in LanguageContent blocks
✅ **Preserves user preferences** across navigation
✅ **Clear feedback** about language availability
✅ **Automatic fallback** handling
✅ **Seamless user experience**

## Example Pages

- **Dotprompt**: JS + Go only (Python not available)
- **Get Started**: All languages supported
- **Future pages**: Can specify any combination

The system gracefully handles all edge cases while maintaining a smooth user experience.

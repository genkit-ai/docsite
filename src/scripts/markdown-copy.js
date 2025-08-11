/**
 * Markdown Copy Functionality
 * 
 * This script handles copying page content as markdown, filtered by the currently selected language.
 * It fetches pre-filtered markdown from the server-side language-specific endpoints.
 */

class MarkdownCopyManager {
  constructor() {
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    const copyButton = document.getElementById('copy-markdown-btn');
    if (copyButton) {
      copyButton.addEventListener('click', () => this.copyMarkdown());
    }
  }

  async copyMarkdown() {
    const button = document.getElementById('copy-markdown-btn');
    if (!button) return;

    try {
      // Show copying state
      this.setButtonState(button, 'copying');

      // Get current language
      const currentLang = this.getCurrentLanguage();
      
      // Get the current page URL and construct the language-specific .md endpoint
      const currentPath = window.location.pathname;
      const mdUrl = `${currentPath}.${currentLang}.md`;
      
      // Fetch the language-filtered markdown
      const response = await fetch(mdUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`);
      }
      
      const markdown = await response.text();
      
      // Copy to clipboard
      await this.copyToClipboard(markdown);
      
      // Show success state
      this.setButtonState(button, 'success');
      
      // Reset button after delay
      setTimeout(() => {
        this.setButtonState(button, 'default');
      }, 2000);

    } catch (error) {
      console.error('Failed to copy markdown:', error);
      this.setButtonState(button, 'error');
      
      // Reset button after delay
      setTimeout(() => {
        this.setButtonState(button, 'default');
      }, 2000);
    }
  }

  getCurrentLanguage() {
    return document.documentElement.getAttribute('data-genkit-lang') || 'js';
  }

  async copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
      } finally {
        textArea.remove();
      }
    }
  }

  setButtonState(button, state) {
    const buttonText = button.querySelector('.button-text');
    const successText = button.querySelector('.success-text');
    
    // Reset classes
    button.classList.remove('copying', 'success', 'error');
    
    switch (state) {
      case 'copying':
        button.classList.add('copying');
        if (buttonText) buttonText.style.display = 'none';
        if (successText) {
          successText.textContent = 'Copying...';
          successText.style.display = 'inline';
        }
        break;
        
      case 'success':
        button.classList.add('success');
        if (buttonText) buttonText.style.display = 'none';
        if (successText) {
          successText.textContent = 'Copied!';
          successText.style.display = 'inline';
        }
        break;
        
      case 'error':
        button.classList.add('error');
        if (buttonText) buttonText.style.display = 'none';
        if (successText) {
          successText.textContent = 'Error';
          successText.style.display = 'inline';
        }
        break;
        
      default: // 'default'
        if (buttonText) buttonText.style.display = 'inline';
        if (successText) successText.style.display = 'none';
        break;
    }
  }
}

// Initialize the markdown copy manager
new MarkdownCopyManager();

/**
 * Language Preference Enhancement for Astro Starlight
 * 
 * This script enhances Starlight's built-in tab synchronization with:
 * 1. Persistent storage of language preference in localStorage
 * 2. Cross-page restoration of language preference
 * 3. Automatic detection and synchronization of language tabs
 */

class LanguagePreferenceEnhancer {
  constructor() {
    this.storageKey = 'genkit-preferred-language';
    this.languages = ['JavaScript', 'Go', 'Python'];
    this.defaultLanguage = 'JavaScript';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Get stored preference or use default
    const storedLanguage = localStorage.getItem(this.storageKey) || this.defaultLanguage;
    
    // Set up event listeners for tab clicks
    this.setupTabListeners();
    
    // Apply stored preference to all language tabs
    this.restoreLanguagePreference(storedLanguage);
    
    // Watch for dynamically added content (e.g., navigation)
    this.observeContentChanges();
  }

  setupTabListeners() {
    // Listen for clicks on all tab buttons
    document.addEventListener('click', (event) => {
      const tabButton = event.target.closest('[role="tab"]');
      if (!tabButton) return;

      // Check if this is a language tab by looking at the text content
      const tabText = tabButton.textContent.trim();
      if (this.languages.includes(tabText)) {
        // Store the preference when a language tab is clicked
        this.storeLanguagePreference(tabText);
      }
    });
  }

  storeLanguagePreference(language) {
    if (!this.languages.includes(language)) {
      console.warn(`Unknown language: ${language}`);
      return;
    }

    // Store preference
    localStorage.setItem(this.storageKey, language);
  }

  restoreLanguagePreference(language) {
    if (!this.languages.includes(language)) {
      console.warn(`Unknown language: ${language}, using default`);
      language = this.defaultLanguage;
    }

    // Find all language tabs and activate the preferred one
    this.activateLanguageTabs(language);
  }

  activateLanguageTabs(language) {
    // Find all tab groups with syncKey="language"
    const languageTabGroups = document.querySelectorAll('[role="tablist"]');
    
    languageTabGroups.forEach(tabList => {
      // Check if this tablist contains language tabs
      const tabs = tabList.querySelectorAll('[role="tab"]');
      let hasLanguageTabs = false;
      let targetTab = null;
      
      // Look for language tabs within this tablist
      tabs.forEach(tab => {
        const tabText = tab.textContent.trim();
        if (this.languages.includes(tabText)) {
          hasLanguageTabs = true;
          if (tabText === language) {
            targetTab = tab;
          }
        }
      });
      
      // If this tablist has language tabs and we found our target, activate it
      if (hasLanguageTabs && targetTab && !this.isTabActive(targetTab)) {
        this.activateTab(targetTab);
      }
    });
  }

  isTabActive(tab) {
    return tab.getAttribute('aria-selected') === 'true';
  }

  activateTab(tab) {
    // Trigger a click event to let Starlight handle the tab activation
    // This ensures we work with Starlight's existing tab system
    tab.click();
  }

  observeContentChanges() {
    // Watch for new content being added (e.g., navigation between pages)
    const observer = new MutationObserver((mutations) => {
      let hasNewTabs = false;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if new tabs were added
            if (node.querySelector && node.querySelector('[role="tablist"]')) {
              hasNewTabs = true;
            }
          }
        });
      });
      
      if (hasNewTabs) {
        // Apply current preference to new tabs after a short delay
        // to ensure Starlight has finished initializing them
        const currentLanguage = localStorage.getItem(this.storageKey) || this.defaultLanguage;
        setTimeout(() => this.restoreLanguagePreference(currentLanguage), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Public method to get current preference
  getCurrentLanguage() {
    return localStorage.getItem(this.storageKey) || this.defaultLanguage;
  }

  // Public method to manually set language
  setLanguage(language) {
    this.storeLanguagePreference(language);
    this.restoreLanguagePreference(language);
  }
}

// Initialize the language preference enhancer
const languagePreferenceEnhancer = new LanguagePreferenceEnhancer();

// Make it globally available for debugging
window.languagePreferenceEnhancer = languagePreferenceEnhancer;

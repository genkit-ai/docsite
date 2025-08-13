/**
 * Unified Page Manager for Genkit Documentation
 * 
 * This script coordinates:
 * 1. Scroll restoration without flashing
 * 2. Language preference management
 * 3. Smooth page transitions
 * 4. Font loading optimization
 */

class UnifiedPageManager {
  constructor() {
    this.storageKeys = {
      scroll: 'genkit-scroll-',
      language: 'genkit-preferred-language'
    };
    this.languages = ['JavaScript', 'Go', 'Python'];
    this.defaultLanguage = 'JavaScript';
    this.isInitialized = false;
    this.isRestoring = false;
    
    // Initialize immediately
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Check for scroll restoration needs
    const scrollKey = this.storageKeys.scroll + window.location.pathname;
    const savedScroll = sessionStorage.getItem(scrollKey);
    const storedScrollPosition = savedScroll ? parseInt(savedScroll, 10) : null;
    
    if (storedScrollPosition && storedScrollPosition > 0) {
      this.isRestoring = true;
      // Use opacity instead of visibility for smoother transition
      document.documentElement.style.opacity = '0';
      document.documentElement.style.transition = 'opacity 0.15s ease-in-out';
      sessionStorage.removeItem(scrollKey);
    }
    
    // Set up language immediately
    this.setupLanguage();
    
    // Set up scroll restoration
    if (this.isRestoring) {
      this.restoreScrollPosition(storedScrollPosition);
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
  }

  setupLanguage() {
    // Get language from URL or storage
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    const storedLang = localStorage.getItem(this.storageKeys.language);
    const currentLang = urlLang || storedLang || 'js';
    
    // Normalize language value
    const normalizedLang = this.normalizeLanguage(currentLang);
    
    // Set HTML attribute immediately
    document.documentElement.setAttribute('data-genkit-lang', normalizedLang);
    
    // Store preference if it came from URL
    if (urlLang) {
      localStorage.setItem(this.storageKeys.language, normalizedLang);
    }
    
    // If we have a stored language preference but no URL parameter, update the URL
    if (!urlLang && storedLang && normalizedLang !== 'js') {
      const url = new URL(window.location);
      url.searchParams.set('lang', normalizedLang);
      window.history.replaceState({}, '', url);
    }
  }

  normalizeLanguage(lang) {
    const langMap = {
      'js': 'js',
      'javascript': 'js',
      'go': 'go',
      'golang': 'go',
      'python': 'python',
      'py': 'python'
    };
    return langMap[lang.toLowerCase()] || 'js';
  }

  restoreScrollPosition(position) {
    const restore = () => {
      // Restore scroll immediately
      window.scrollTo(0, position);
      
      // Wait for layout to settle, then show content
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.style.opacity = '1';
          this.isRestoring = false;
          
          // Clean up transition after it completes
          setTimeout(() => {
            document.documentElement.style.transition = '';
          }, 150);
        });
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', restore);
    } else {
      restore();
    }

    // Fallback to ensure content is always visible
    setTimeout(() => {
      if (this.isRestoring) {
        document.documentElement.style.opacity = '1';
        document.documentElement.style.transition = '';
        this.isRestoring = false;
      }
    }, 500);
  }

  setupEventListeners() {
    // Store scroll position before page unload
    const storeScrollPosition = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 0) {
        const scrollKey = this.storageKeys.scroll + window.location.pathname;
        sessionStorage.setItem(scrollKey, scrollY.toString());
      }
    };

    window.addEventListener('beforeunload', storeScrollPosition);
    window.addEventListener('pagehide', storeScrollPosition);

    // Handle language selector clicks
    document.addEventListener('click', (event) => {
      const langButton = event.target.closest('[data-lang]');
      if (langButton && langButton.classList.contains('lang-pill')) {
        event.preventDefault();
        this.setLanguage(langButton.dataset.lang);
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.setupLanguage();
      this.updateLanguageUI();
    });

    // Update language UI when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.updateLanguageUI());
    } else {
      this.updateLanguageUI();
    }
  }

  setLanguage(lang) {
    const normalizedLang = this.normalizeLanguage(lang);
    
    // Update URL
    const url = new URL(window.location);
    if (normalizedLang === 'js') {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', normalizedLang);
    }
    
    window.history.replaceState({}, '', url);
    
    // Store preference
    localStorage.setItem(this.storageKeys.language, normalizedLang);
    
    // Update HTML attribute
    document.documentElement.setAttribute('data-genkit-lang', normalizedLang);
    
    // Update UI
    this.updateLanguageUI();
  }

  updateLanguageUI() {
    const currentLang = document.documentElement.getAttribute('data-genkit-lang') || 'js';
    
    // Update language selector pills
    document.querySelectorAll('.lang-pill').forEach(pill => {
      const isActive = pill.dataset.lang === currentLang;
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    
    // Handle language redirect notices
    this.updateLanguageRedirectNotices(currentLang);
  }

  updateLanguageRedirectNotices(currentLang) {
    const notices = document.querySelectorAll('#language-redirect-notice');
    
    notices.forEach(notice => {
      const customMessage = notice.dataset.customMessage;
      const customMessages = notice.dataset.customMessages ? JSON.parse(notice.dataset.customMessages) : {};
      
      // Get the supported languages from the nearest language selector
      const languageSelector = notice.closest('article')?.querySelector('.language-selector') || 
                              document.querySelector('.language-selector');
      
      let supportedLanguages = ['js', 'go']; // default
      if (languageSelector) {
        // Get supported languages from the actual buttons in the selector
        const langButtons = languageSelector.querySelectorAll('.lang-pill[data-lang]');
        if (langButtons.length > 0) {
          supportedLanguages = Array.from(langButtons).map(button => button.dataset.lang);
        }
      }
      
      // Check if current language is supported
      const isLanguageSupported = supportedLanguages.includes(currentLang);
      
      if (!isLanguageSupported) {
        // Show the notice with appropriate message
        let message = customMessage || `This content is not available for ${this.getLanguageDisplayName(currentLang)}.`;
        
        // Use custom message for specific language if available
        if (customMessages[currentLang]) {
          message = customMessages[currentLang];
        }
        
        const messageContent = notice.querySelector('#redirect-message-content');
        if (messageContent) {
          messageContent.innerHTML = message;
        }
        
        notice.style.display = 'block';
      } else {
        // Hide the notice
        notice.style.display = 'none';
      }
    });
  }

  getLanguageDisplayName(lang) {
    const displayNames = {
      'js': 'JavaScript',
      'go': 'Go',
      'python': 'Python'
    };
    return displayNames[lang] || lang;
  }

  // Public method to get current language
  getCurrentLanguage() {
    return document.documentElement.getAttribute('data-genkit-lang') || 'js';
  }

  // Public method to manually set language
  setLanguagePublic(language) {
    this.setLanguage(language);
  }
}

// Initialize the unified page manager
const unifiedPageManager = new UnifiedPageManager();

// Make it globally available for debugging and compatibility
window.unifiedPageManager = unifiedPageManager;

// Legacy compatibility for existing language preference enhancer
window.languagePreferenceEnhancer = {
  getCurrentLanguage: () => unifiedPageManager.getCurrentLanguage(),
  setLanguage: (lang) => unifiedPageManager.setLanguagePublic(lang)
};

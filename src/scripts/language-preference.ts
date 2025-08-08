type Language = 'js' | 'go' | 'python';

const LANGUAGES: Record<Language, string> = {
  js: 'JavaScript',
  go: 'Go',
  python: 'Python',
};

const LANGUAGE_CODES = Object.keys(LANGUAGES) as Language[];
const DEFAULT_LANGUAGE: Language = 'js';

class LanguagePreferenceEnhancer {
  private storageKey = 'genkit-preferred-language';

  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang') as Language | null;
    const storedLanguage = localStorage.getItem(this.storageKey) as Language | null;

    let language: Language;

    if (langFromUrl && LANGUAGE_CODES.includes(langFromUrl)) {
      language = langFromUrl;
      localStorage.setItem(this.storageKey, language);
    } else if (storedLanguage && LANGUAGE_CODES.includes(storedLanguage)) {
      language = storedLanguage;
      this.updateUrl(language);
    } else {
      language = DEFAULT_LANGUAGE;
      localStorage.setItem(this.storageKey, language);
      this.updateUrl(language);
    }

    this.setupTabListeners();
    this.restoreLanguagePreference(language);
    this.observeContentChanges();
  }

  setupTabListeners() {
    document.addEventListener('click', (event) => {
      const tabButton = (event.target as HTMLElement).closest('[role="tab"]');
      if (!tabButton) return;

      const tabText = tabButton.textContent?.trim();
      if (tabText && Object.values(LANGUAGES).includes(tabText)) {
        const langCode = (Object.keys(LANGUAGES) as Language[]).find((key) => LANGUAGES[key] === tabText);
        if (langCode) {
          this.storeLanguagePreference(langCode);
        }
      }
    });
  }

  storeLanguagePreference(language: Language) {
    if (!LANGUAGE_CODES.includes(language)) {
      console.warn(`Unknown language: ${language}`);
      return;
    }
    localStorage.setItem(this.storageKey, language);
    this.updateUrl(language);
    window.dispatchEvent(new CustomEvent('language-preference-changed', { detail: { language } }));
  }

  updateUrl(language: Language) {
    const url = new URL(window.location.toString());
    url.searchParams.set('lang', language);
    window.history.replaceState({}, '', url);
  }

  restoreLanguagePreference(language: Language) {
    if (!LANGUAGE_CODES.includes(language)) {
      console.warn(`Unknown language: ${language}, using default`);
      language = DEFAULT_LANGUAGE;
    }
    this.activateLanguageTabs(language);
  }

  activateLanguageTabs(language: Language) {
    const languageTabGroups = document.querySelectorAll('[role="tablist"]');
    languageTabGroups.forEach((tabList) => {
      const tabs = tabList.querySelectorAll<HTMLElement>('[role="tab"]');
      let hasLanguageTabs = false;
      let targetTab: HTMLElement | null = null;

      tabs.forEach((tab) => {
        const tabText = tab.textContent?.trim();
        if (tabText && Object.values(LANGUAGES).includes(tabText)) {
          hasLanguageTabs = true;
          if (LANGUAGES[language] === tabText) {
            targetTab = tab;
          }
        }
      });

      if (hasLanguageTabs && targetTab && (targetTab as HTMLElement).getAttribute('aria-selected') !== 'true') {
        (targetTab as HTMLElement).click();
      }
    });
  }

  observeContentChanges() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const currentLanguage = (localStorage.getItem(this.storageKey) as Language) || DEFAULT_LANGUAGE;
          this.restoreLanguagePreference(currentLanguage);
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  getCurrentLanguage(): Language {
    const lang = localStorage.getItem(this.storageKey) as Language | null;
    return lang && LANGUAGE_CODES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  }

  getLanguageName(language: Language): string {
    return LANGUAGES[language] || LANGUAGES[DEFAULT_LANGUAGE];
  }

  setLanguage(language: Language) {
    this.storeLanguagePreference(language);
    this.restoreLanguagePreference(language);
  }
}

export const languagePreferenceEnhancer = new LanguagePreferenceEnhancer();

declare global {
  interface Window {
    languagePreferenceEnhancer: LanguagePreferenceEnhancer;
  }
}

window.languagePreferenceEnhancer = languagePreferenceEnhancer;

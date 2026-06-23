/** Client-side docs language routing, redirects, and preferences. */

export const LANGUAGE_FALLBACK_ORDER = ['js', 'go', 'dart', 'python'] as const;

export type SupportedLanguage = (typeof LANGUAGE_FALLBACK_ORDER)[number];

export const STORAGE_KEYS = {
  globalPreference: 'genkit-global-language-preference',
  currentLanguage: 'genkit-current-language',
} as const;

const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  js: 'js',
  javascript: 'js',
  go: 'go',
  golang: 'go',
  python: 'python',
  py: 'python',
  dart: 'dart',
};

export type DocLanguageConfig = {
  docLanguageSupport: Record<string, SupportedLanguage[]>;
  docLanguageAgnostic: Record<string, boolean>;
};

const EMPTY_DOC_CONFIG: DocLanguageConfig = {
  docLanguageSupport: {},
  docLanguageAgnostic: {},
};

export function normalizeLanguage(lang: string): SupportedLanguage {
  return LANGUAGE_ALIASES[lang.toLowerCase()] || 'js';
}

declare global {
  interface Window {
    unifiedPageManager?: UnifiedPageManager;
  }
}

export class UnifiedPageManager {
  private docLanguageSupport: Record<string, SupportedLanguage[]>;
  private docLanguageAgnostic: Record<string, boolean>;
  private isInitialized = false;

  setDocConfig(config: DocLanguageConfig) {
    if (Object.keys(config.docLanguageSupport).length > 0) {
      this.docLanguageSupport = config.docLanguageSupport;
    }
    if (Object.keys(config.docLanguageAgnostic).length > 0) {
      this.docLanguageAgnostic = config.docLanguageAgnostic;
    }
  }

  constructor(config: DocLanguageConfig = EMPTY_DOC_CONFIG) {
    this.docLanguageSupport = config.docLanguageSupport;
    this.docLanguageAgnostic = config.docLanguageAgnostic;

    // Neutral-path redirect needs no DOM — run immediately to avoid flashing content.
    if (this.redirectNeutralDocsPathToCanonicalLanguage()) {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init(), { once: true });
    } else {
      this.init();
    }
  }

  init() {
    this.rewriteDocsEntryLinks();

    if (this.redirectNeutralDocsPathToCanonicalLanguage()) {
      return;
    }

    this.setupLanguage();

    if (!this.isInitialized) {
      this.setupEventListeners();
      this.isInitialized = true;
    }
  }

  getStoredLanguage(supported: SupportedLanguage[]): SupportedLanguage | null {
    const keys = [STORAGE_KEYS.currentLanguage, STORAGE_KEYS.globalPreference];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const preferred = normalizeLanguage(raw);
      if (supported.includes(preferred)) {
        return preferred;
      }
    }
    return LANGUAGE_FALLBACK_ORDER.find((lang) => supported.includes(lang)) || null;
  }

  /** Point neutral docs entry links at the preferred language (avoids redirect flash). */
  rewriteDocsEntryLinks() {
    const preferred = this.getStoredLanguage([...LANGUAGE_FALLBACK_ORDER]) || 'js';
    document.querySelectorAll<HTMLAnchorElement>('[data-genkit-docs-entry]').forEach((anchor) => {
      const neutralPath = (anchor.getAttribute('href') || '').replace(/\/$/, '');
      const slugMatch = neutralPath.match(/^\/docs\/([^/?#]+)$/);
      if (!slugMatch) return;
      const slug = slugMatch[1];
      if ((LANGUAGE_FALLBACK_ORDER as readonly string[]).includes(slug)) return;
      anchor.href = `/docs/${preferred}/${slug}/`;
    });
  }

  redirectNeutralDocsPathToCanonicalLanguage() {
    const normalizedPath = window.location.pathname.replace(/\/$/, '') || '/';
    if (!normalizedPath.startsWith('/docs/')) return false;
    if (/^\/docs\/(js|go|dart|python)(\/|$)/.test(normalizedPath)) return false;

    const supported = this.docLanguageSupport[normalizedPath];
    if (!Array.isArray(supported) || supported.length === 0) return false;
    if (this.docLanguageAgnostic[normalizedPath]) return false;

    const canonicalLanguage = this.getStoredLanguage(supported);
    if (!canonicalLanguage) return false;

    const slug = normalizedPath.replace(/^\/docs\//, '');
    const targetPath = `/docs/${canonicalLanguage}/${slug}/`;
    const targetUrl = `${targetPath}${window.location.search}${window.location.hash}`;
    if (window.location.pathname === targetPath) return false;

    window.location.replace(targetUrl);
    return true;
  }

  setupLanguage() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    const pathLangMatch = window.location.pathname.match(/^\/docs\/(js|go|dart|python)(\/|$)/);
    const pathLang = pathLangMatch ? pathLangMatch[1] : null;
    const normalizedRequestedLang = urlLang ? normalizeLanguage(urlLang) : null;
    const pathSlugMatch = window.location.pathname.match(/^\/docs\/(js|go|dart|python)\/(.+)$/);

    if (pathLang && pathSlugMatch && normalizedRequestedLang) {
      const slugPath = pathSlugMatch[2].replace(/\/$/, '');
      const basePath = `/docs/${slugPath}`;
      const supported = this.docLanguageSupport[basePath];
      const isAgnostic = Boolean(this.docLanguageAgnostic[basePath]);

      if (
        !isAgnostic &&
        Array.isArray(supported) &&
        supported.includes(normalizedRequestedLang) &&
        normalizedRequestedLang !== pathLang
      ) {
        const nextUrl = new URL(window.location.href);
        nextUrl.pathname = `/docs/${normalizedRequestedLang}/${slugPath}/`;
        nextUrl.searchParams.delete('lang');
        window.location.replace(nextUrl.toString());
        return;
      }
    }

    const selectedLang = pathLang
      ? normalizeLanguage(pathLang)
      : normalizedRequestedLang
        ? normalizedRequestedLang
        : this.getStoredLanguage([...LANGUAGE_FALLBACK_ORDER]) || 'js';

    if (urlLang) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('lang');
      window.history.replaceState({}, '', currentUrl);
    }

    localStorage.setItem(STORAGE_KEYS.currentLanguage, selectedLang);
    if (urlLang || pathLang) {
      localStorage.setItem(STORAGE_KEYS.globalPreference, selectedLang);
    }

    document.documentElement.setAttribute('data-genkit-lang', selectedLang);
    document.dispatchEvent(
      new CustomEvent('genkit:languagechange', {
        detail: { language: selectedLang },
      }),
    );
  }

  setupEventListeners() {
    document.addEventListener('astro:page-load', () => this.init());
    window.addEventListener('popstate', () => this.init());
    document.addEventListener('genkit:languagechange', () => this.rewriteDocsEntryLinks());
  }

  setLanguage(lang: string, isUserChoice = true) {
    const normalizedLang = normalizeLanguage(lang);

    localStorage.setItem(STORAGE_KEYS.currentLanguage, normalizedLang);
    if (isUserChoice) {
      localStorage.setItem(STORAGE_KEYS.globalPreference, normalizedLang);
    }

    const pathMatch = window.location.pathname.match(/^\/docs\/(js|go|dart|python)\/(.+)$/);
    if (pathMatch) {
      const slugPath = pathMatch[2].replace(/\/$/, '');
      const basePath = `/docs/${slugPath}`;
      const supported = this.docLanguageSupport[basePath];
      const isAgnostic = this.docLanguageAgnostic[basePath];
      const targetPath = isAgnostic
        ? `${basePath}/`
        : Array.isArray(supported) && supported.includes(normalizedLang)
          ? `/docs/${normalizedLang}/${slugPath}/`
          : `/docs/${normalizedLang}/overview/`;
      if (targetPath !== window.location.pathname) {
        window.location.assign(targetPath);
        return;
      }
    }

    document.documentElement.setAttribute('data-genkit-lang', normalizedLang);
    document.dispatchEvent(
      new CustomEvent('genkit:languagechange', {
        detail: { language: normalizedLang },
      }),
    );
  }
}

export function initUnifiedPageManager(config: DocLanguageConfig = EMPTY_DOC_CONFIG) {
  if (window.unifiedPageManager) {
    window.unifiedPageManager.setDocConfig(config);
    window.unifiedPageManager.init();
    return window.unifiedPageManager;
  }

  window.unifiedPageManager = new UnifiedPageManager(config);
  return window.unifiedPageManager;
}

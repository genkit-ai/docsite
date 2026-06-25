import { createHighlighter, type Highlighter } from 'shiki';
import { GOOGLE_DARK_THEME } from '../../google-theme';

const shikiLangById: Record<string, string> = {
  js: 'javascript',
  go: 'go',
  python: 'python',
  dart: 'dart',
};

let highlighter: Highlighter | undefined;

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [GOOGLE_DARK_THEME],
      langs: ['javascript', 'go', 'python', 'dart'],
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, lang: string) {
  const h = await getHighlighter();
  return h.codeToHtml(code, {
    lang: shikiLangById[lang] ?? lang,
    theme: GOOGLE_DARK_THEME.name,
  });
}

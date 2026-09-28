import { createHighlighter, type Highlighter } from 'shiki';
import { GOOGLE_DARK_THEME } from '../../google-theme';

const shikiLangById: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  go: 'go',
  python: 'python',
  dart: 'dart',
};

let highlighter: Highlighter | undefined;

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [GOOGLE_DARK_THEME],
      langs: ['javascript', 'typescript', 'go', 'python', 'dart'],
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Highlights a short snippet and returns one HTML string per source line,
 * without the surrounding `<pre>`/`<code>` wrappers.
 *
 * Use this when a component needs per-line control (for example, swapping a
 * single line in place) while keeping colors identical to `highlightCode`.
 */
export async function highlightLines(code: string, lang: string): Promise<string[]> {
  const h = await getHighlighter();
  const tokens = h.codeToTokensBase(code, {
    lang: (shikiLangById[lang] ?? lang) as Parameters<Highlighter['codeToTokensBase']>[1]['lang'],
    theme: GOOGLE_DARK_THEME.name,
  });
  return tokens.map((line) =>
    line
      .map((token) => `<span style="color:${token.color}">${escapeHtml(token.content)}</span>`)
      .join(''),
  );
}

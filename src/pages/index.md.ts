import type { APIRoute } from 'astro';
import { buildLandingMarkdown } from '../data/landing';

/**
 * Markdown version of the landing page for AI agents and LLM tools.
 * Linked from the landing page with `<link rel="alternate" type="text/markdown">`
 * and from llms.txt.
 */
export const GET: APIRoute = () =>
  new Response(buildLandingMarkdown(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });

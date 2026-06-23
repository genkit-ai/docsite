import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { blogSchema } from 'starlight-blog/schema';

// Mirrors Starlight's built-in `docsLoader()` (same base and extensions) but additionally
// excludes any `README.md`, so contributor-facing READMEs (e.g. src/content/docs/blog/README.md)
// live in the repo without being published as pages.
const docsExtensions = 'markdown,mdown,mkdn,mkd,mdwn,md,mdx';

const description = z
	.union([
		z.string(),
		z
			.object({
				default: z.string().optional(),
				js: z.string().optional(),
				go: z.string().optional(),
				dart: z.string().optional(),
				python: z.string().optional(),
			})
			.transform((value) => value.default),
	])
	.optional();

export const collections = {
	docs: defineCollection({
		loader: glob({
			base: './src/content/docs',
			pattern: [`**/[^_]*.{${docsExtensions}}`, '!**/README.md'],
		}),
		schema: (context) => {
			const starlightBase = docsSchema()(context) as unknown as z.AnyZodObject;
			return (
				starlightBase
					// Replace Starlight's plain-string `description` with our language-aware union so
					// pages can supply per-language meta descriptions (see the `description` schema above).
					.omit({ description: true })
					.extend({
						description,
						supportedLanguages: z
							.array(z.enum(['js', 'go', 'dart', 'python']))
							.default(['js', 'go', 'dart', 'python']),
						isLanguageAgnostic: z.boolean().optional(),
					})
					// Blog post frontmatter (title, date, authors, tags, excerpt, cover, ...) for posts under src/content/docs/blog/.
					.merge(blogSchema(context))
					// Author posts the same way as docs: with `description`. Starlight emits the meta/OG
					// description from it natively, and we default the blog card's `excerpt` to it so the
					// summary is written once. A post may still set `excerpt` explicitly to override.
					.transform((data) => {
						let date = data.date;
						if (date) {
							const d = new Date(date);
							if (!isNaN(d.getTime())) {
								d.setUTCHours(12);
								date = d;
							}
						}
						return {
							...data,
							date,
							excerpt: data.excerpt ?? data.description,
						};
					})
			);
		},
	}),
};

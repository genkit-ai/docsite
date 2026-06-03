import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { blogSchema } from 'starlight-blog/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: (context) => {
			const starlightBase = docsSchema()(context) as unknown as z.AnyZodObject;
			return (
				starlightBase
					.extend({
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
					.transform((data) => ({
						...data,
						excerpt: data.excerpt ?? data.description,
					}))
			);
		},
	}),
};

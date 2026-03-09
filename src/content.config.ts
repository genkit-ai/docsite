import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				supportedLanguages: z.array(z.enum(['js', 'go', 'dart', 'python'])).default(['js', 'go', 'dart', 'python']),
				isLanguageAgnostic: z.boolean().optional(),
			}),
		}),
	}),
};

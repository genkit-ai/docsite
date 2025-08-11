import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

const releasesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    publishedAt: z.date(),
  }),
});

export const collections = {
  'docs': defineCollection({ schema: docsSchema() }),
  'releases': releasesCollection,
};

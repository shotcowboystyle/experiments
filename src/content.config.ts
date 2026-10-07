import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const experiments = defineCollection({
  loader: glob({ base: './src/content/experiments', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    /** Demo component path relative to the entry, e.g. './Demo.astro'. */
    demo: z.string().optional(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    title: z.string(),
  }),
});

export const collections = { experiments };

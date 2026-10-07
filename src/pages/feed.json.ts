import { existsSync } from 'node:fs';
import path from 'node:path';

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { sortByDate } from '~/lib/sort-by-date';
import { withBase } from '~/lib/with-base';

/**
 * The experiments, newest first, for the portfolio to read at build time.
 * Only entries with a running demo and a captured poster are listed: a teaser
 * tile needs both something to show and somewhere to go.
 */
export const GET: APIRoute = async ({ site }) => {
  const previews = path.join(process.cwd(), 'public/experiments/previews');
  const entries = sortByDate(await getCollection('experiments')).filter(
    (entry) => entry.data.demo && existsSync(path.join(previews, `${entry.id}.jpg`))
  );

  const feed = entries.map((entry) => ({
    description: entry.data.description ?? '',
    poster: new URL(withBase(`/experiments/previews/${entry.id}.jpg`), site).href,
    pubDate: entry.data.pubDate.toISOString(),
    slug: entry.id,
    title: entry.data.title,
  }));

  return Response.json(feed);
};

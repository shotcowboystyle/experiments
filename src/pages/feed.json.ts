import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { posterPath } from '~/lib/poster';
import { sortByDate } from '~/lib/sort-by-date';

/**
 * The experiments, newest first, for the portfolio to read at build time.
 * Only entries with a running demo and a captured poster are listed: a teaser
 * tile needs both something to show and somewhere to go.
 */
export const GET: APIRoute = async ({ site }) => {
  const feed = sortByDate(await getCollection('experiments')).flatMap((entry) => {
    const poster = posterPath(entry.id);
    if (!(entry.data.demo && poster)) {
      return [];
    }
    return {
      description: entry.data.description ?? '',
      poster: new URL(poster, site).href,
      pubDate: entry.data.pubDate.toISOString(),
      slug: entry.id,
      title: entry.data.title,
    };
  });

  return Response.json(feed);
};

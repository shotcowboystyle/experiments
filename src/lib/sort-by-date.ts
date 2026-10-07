export const sortByDate = <T extends { data: { pubDate: Date } }>(entries: T[]): T[] =>
  entries.toSorted((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

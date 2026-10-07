import { describe, expect, it } from 'vitest';

import { sortByDate } from './sort-by-date';

describe(sortByDate, () => {
  it('sorts newest first without mutating input', () => {
    const older = { data: { pubDate: new Date('2024-01-01') } };
    const newer = { data: { pubDate: new Date('2025-06-01') } };
    const input = [older, newer];
    expect(sortByDate(input)).toStrictEqual([newer, older]);
    expect(input[0]).toBe(older);
  });
});

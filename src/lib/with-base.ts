/**
 * The site is served from `/experiments/` on shotcowboystyle.github.io, beside
 * the portfolio, so every internal path goes through the configured base.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/u, '');

export const withBase = (path: string): string => `${base}${path}`;

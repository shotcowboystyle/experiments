import process from 'node:process';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
// @web-starter:imports

export default defineConfig({
  // Served beside the portfolio on the same origin, so crossing between the
  // two sites is a same-origin navigation and gets its view transition.
  base: '/experiments',
  compressHTML: true,
  // Fetched at build time and self-hosted; a component opts in with <Font />.
  fonts: [
    {
      cssVariable: '--font-bebas-neue',
      name: 'Bebas Neue',
      provider: fontProviders.google(),
      weights: [400],
    },
  ],
  integrations: [
    mdx(),
    sitemap(),
    react(),
    // @web-starter:integrations
  ],
  output: 'static',
  site: process.env.SITE_URL || 'https://shotcowboystyle.github.io',
  // Pages 301s the bare path to the slash; keep URLs and the sitemap on the slash form.
  trailingSlash: 'always',
});

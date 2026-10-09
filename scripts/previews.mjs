// Captures a square poster of each experiment's `.demo` stage into
// public/experiments/previews/<slug>.jpg for the gallery tiles.
//
// Usage: start the dev server (`pnpm dev`), then `pnpm previews [slug…]`.
// The stage is the `.demo`, or a full-bleed experiment's `[data-preview]` root.
// Experiments with neither are skipped and keep their text tile.
import { mkdir } from 'node:fs/promises';
import process from 'node:process';

import { chromium } from '@playwright/test';

const BASE_URL = process.env.PREVIEW_BASE_URL ?? 'http://localhost:4321/experiments';
const OUT_DIR = 'public/experiments/previews';
// Roughly tile-sized, so the demo reads at its real scale; 2x for retina.
const SIZE = 440;

/** Per-experiment setup before the shot, e.g. opening the sheet. */
const STAGE = {
  // Wait for the island, then let the stage fill the poster.
  carousel: async (page) => {
    await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
    // The props panel is tuning UI; the poster is the carousel alone.
    await page.addStyleTag({ content: '.demo fieldset { display: none; }' });
  },
  // Pins its own light scheme; the toggle is how it goes dark.
  'css-only-toggle': async (page) => {
    // The input is visually hidden offscreen, so set it rather than click it.
    await page.getByRole('checkbox', { name: 'Dark mode' }).evaluate((input) => {
      input.checked = true;
    });
  },
  // The stage sets its own clamped block-size, which beats `inset: 0`.
  'cyclic-sentence-circle': async (page) => {
    await page.addStyleTag({ content: '.ccs { block-size: 100vh !important; inline-size: 100vw !important; }' });
  },
  'fanning-folder': async (page) => {
    await page.getByRole('checkbox', { name: 'Open folder' }).check({ force: true });
  },
  // Park the highlighter on the button so the poster shows the morph.
  'gooey-cursor-highlight': async (page) => {
    await page.getByRole('button', { name: 'A button' }).hover();
    await page.waitForTimeout(600);
  },
  // The pattern is the experiment; at poster width the control bar wraps.
  infinity: async (page) => {
    await page.addStyleTag({ content: '.infinity .controls { display: none; }' });
  },
  // Taller than the poster at full size; shrink it so the whole card fits.
  'profile-card': async (page) => {
    await page.addStyleTag({ content: '.card-profile { zoom: 0.8; }' });
  },
  sheet: async (page) => {
    await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
    await page.getByRole('button', { name: 'Wallet options' }).click();
    await page.getByRole('dialog').waitFor();
  },
};

const browser = await chromium.launch();
const page = await browser.newPage({
  // Every poster is shot in dark mode; the site follows the OS until the dock picks.
  colorScheme: 'dark',
  deviceScaleFactor: 2,
  reducedMotion: 'no-preference',
  viewport: { height: SIZE, width: SIZE },
});

let slugs = process.argv.slice(2);
if (slugs.length === 0) {
  await page.goto(`${BASE_URL}/`);
  const hrefs = await page.locator('main li a').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  slugs = hrefs.map((href) => href.split('/').at(-2));
}

await mkdir(OUT_DIR, { recursive: true });

// Sequential on purpose: every shot drives the one shared page.
/* oxlint-disable no-await-in-loop */
for (const slug of slugs) {
  await page.goto(`${BASE_URL}/${slug}/`, { waitUntil: 'networkidle' });
  const demo = page.locator('.demo, [data-preview]').first();
  if ((await demo.count()) === 0) {
    console.log(`skip  ${slug} (no stage)`);
    continue;
  }
  // Promote the stage to fill the viewport, so the poster is the demo alone.
  await demo.evaluate((el) =>
    Object.assign(el.style, {
      borderRadius: '0',
      boxShadow: 'none',
      inset: '0',
      margin: '0',
      outline: 'none',
      position: 'fixed',
      zIndex: '9000',
    })
  );
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
  // Offscreen lazy images never loaded; resize lets layout scripts re-measure.
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) {
      img.loading = 'eager';
    }
    await Promise.all(
      // Safe to ignore: a broken image still shows up, missing, in the poster.
      [...document.images].map((img) => img.decode().catch(() => null))
    );
    window.dispatchEvent(new Event('resize'));
  });
  await STAGE[slug]?.(page);
  // Let entrances and fades settle before the shot.
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/${slug}.jpg`, quality: 85, type: 'jpeg' });
  console.log(`saved ${OUT_DIR}/${slug}.jpg`);
}
/* oxlint-enable no-await-in-loop */

await browser.close();

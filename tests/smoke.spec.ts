import { expect, test } from '@playwright/test';

test('index lists experiments and detail page links back', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const firstEntry = page.locator('main li a').first();
  await expect(firstEntry).toBeVisible();
  await firstEntry.click();
  // The dock handlers attach from a module script; wait for it before clicking.
  await page.waitForLoadState();
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeHidden();
  await page.getByRole('button', { name: 'Details' }).click();
  await expect(heading).toBeVisible();
  // The panel slides in from the left edge.
  await expect.poll(() => page.locator('#info').evaluate((el) => el.getBoundingClientRect().x)).toBe(0);
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Experiments' }).click();
  await expect(page).toHaveURL('./');
});

test('dock back arrow returns to the experiments list', async ({ page }) => {
  await page.goto('./sheet/');
  await page.getByRole('link', { name: 'Back to experiments' }).click();
  await expect(page).toHaveURL('./');
});

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('details scrolls the panel into view', async ({ page }) => {
    await page.goto('./sheet/');
    await page.waitForLoadState();
    await page.getByRole('button', { name: 'Details' }).click();
    await expect(page.locator('#info')).toBeInViewport();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});

test('stage shrinks with the details panel instead of snapping', async ({ page }) => {
  await page.goto('./sheet/');
  await page.waitForLoadState();
  const stage = page.locator('#stage');
  const full = await stage.evaluate((el) => el.getBoundingClientRect().width);
  await page.getByRole('button', { name: 'Details' }).click();
  // Freeze the transition halfway; a snapped width would already be at half.
  const mid = await stage.evaluate((el) => {
    const [anim] = el.getAnimations();
    anim?.pause();
    if (anim) {
      anim.currentTime = 150;
    }
    return el.getBoundingClientRect().width;
  });
  expect(mid).toBeLessThan(full);
  expect(mid).toBeGreaterThan(full / 2 + 50);
});

test('dock scheme switch flips and persists the color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./sheet/');
  await page.waitForLoadState();
  const scheme = page.getByRole('switch', { name: 'Dark mode' });
  const rootScheme = () => page.evaluate(() => document.documentElement.style.colorScheme);
  await expect(scheme).toHaveAttribute('aria-checked', 'false');
  await scheme.click();
  await expect(scheme).toHaveAttribute('aria-checked', 'true');
  expect(await rootScheme()).toBe('dark');
  await page.reload();
  await expect(scheme).toHaveAttribute('aria-checked', 'true');
  expect(await rootScheme()).toBe('dark');
});

test('drawer lists every experiment and navigates', async ({ page }) => {
  await page.goto('./sheet/');
  const link = page.getByRole('link', { name: 'Carousel' });
  await expect(link).toBeHidden();
  await page.getByRole('button', { name: 'Browse experiments' }).click();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL('./carousel/');
});

test('mdx experiment renders its imported component', async ({ page }) => {
  await page.goto('./css-only-toggle/');
  const demo = page.getByTestId('toggle-demo');
  await expect(demo).toBeVisible();
  const before = await demo.evaluate((el) => getComputedStyle(el).colorScheme);
  await demo.locator('label[for="dn"]').click();
  await expect.poll(() => demo.evaluate((el) => getComputedStyle(el).colorScheme)).not.toBe(before);
});

test('resizer handle narrows the frame when dragged', async ({ page }) => {
  await page.goto('./immature-responsive-design/');
  const frame = page.locator('#resize-me');
  const handle = page.getByRole('separator', { name: 'Frame width' });
  const width = () => frame.evaluate((el) => el.getBoundingClientRect().width);
  const before = await width();
  const { x, y } = await handle.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 200, y, { steps: 5 });
  await page.mouse.up();
  await expect.poll(width).toBeLessThan(before - 150);
});

test('bottom sheet opens and moves between stages', async ({ page }) => {
  await page.goto('./sheet/');
  // The trigger is server-rendered; clicks before the island hydrates are dropped.
  await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  await page.getByRole('button', { name: 'Wallet options' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS('position', 'fixed');
  await sheet.getByRole('button', { name: 'View Recovery Phrase' }).click();
  await expect(sheet.getByRole('button', { name: 'Reveal' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Cancel' }).click();
  await expect(sheet.getByRole('button', { name: 'Remove Wallet' })).toBeVisible();
});

test('fanning folder opens from the keyboard', async ({ page }) => {
  await page.goto('./fanning-folder/');
  const toggle = page.getByRole('checkbox', { name: 'Open folder' });
  const search = page.getByRole('searchbox', { name: 'Search files' });
  await expect(search).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toBeChecked();
  await expect(search).toBeVisible();
});

test('window licker loop can be paused', async ({ page }) => {
  await page.goto('./window-licker/');
  const tongue = page.getByTestId('window-licker-demo').locator('.tongue').first();
  await page.getByRole('checkbox', { name: 'Pause animation' }).check();
  await expect.poll(() => tongue.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused');
});

test('infinity pauses and scrolls by wheel', async ({ page }) => {
  await page.goto('./infinity/');
  const demo = page.getByTestId('infinity-demo');
  const layer = demo.locator('[data-bg="seigaiha"]');
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect.poll(() => layer.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused');
  await demo.hover();
  await page.mouse.wheel(0, 30);
  await expect.poll(() => layer.evaluate((el) => el.style.getPropertyValue('--offset'))).toBe('-30px');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('profile card follow button toggles pressed state', async ({ page }) => {
  await page.goto('./profile-card/');
  const follow = page.getByRole('button', { name: 'Follow' });
  await expect(follow).toHaveAttribute('aria-pressed', 'false');
  await follow.click();
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  await expect(follow).toHaveText(/Following/u);
});

test('css-only toggle checkbox is named', async ({ page }) => {
  await page.goto('./css-only-toggle/');
  await expect(page.getByRole('checkbox', { name: 'Dark mode' })).toBeAttached();
});

test('cyclic sentence lines run opposite ways and speed up on scroll', async ({ page }) => {
  await page.goto('./cyclic-sentence-circle/');
  const tracks = page.getByTestId('cyclic-circle-sentence-demo').locator('[data-ccs-track]');
  await expect(tracks).toHaveCount(6);
  // Accents never touch and never leave more than two plain phrases between them, seam included.
  const gaps = await tracks.evaluateAll((els) =>
    els.flatMap((el) => {
      // Every phrase is two words, so a word count gives the phrase index.
      let words = 0;
      const hits: number[] = [];
      for (const node of el.firstElementChild?.childNodes ?? []) {
        if (node.nodeName === 'EM') {
          hits.push(words / 2);
        }
        words += (node.textContent ?? '').trim().split(/\s+/u).filter(Boolean).length;
      }
      const phrases = words / 2;
      return hits.map((hit, i) => (hits[i + 1] ?? (hits[0] ?? 0) + phrases) - hit);
    })
  );
  expect(gaps.length).toBeGreaterThan(5);
  expect(gaps.every((gap) => gap === 2 || gap === 3)).toBe(true);
  const xs = () => tracks.evaluateAll((els) => els.map((el) => Number(el.style.getPropertyValue('--ccs-x'))));
  const drift = async (ms: number) => {
    const before = await xs();
    await page.waitForTimeout(ms);
    // Wraps happen at most once per 40s copy, so a short sample never crosses one.
    const after = await xs();
    return after.map((x, i) => x - (before[i] ?? 0));
  };
  const rest = await drift(300);
  expect(Math.sign(rest[0] ?? 0)).toBe(-Math.sign(rest[1] ?? 0));
  await page.mouse.wheel(0, 600);
  const boosted = await drift(300);
  expect(Math.abs(boosted[0] ?? 0)).toBeGreaterThan(Math.abs(rest[0] ?? 0) * 1.5);
});

test('gooey cursor follows the pointer and highlights a hovered control', async ({ page }) => {
  await page.goto('./gooey-cursor-highlight/');
  const demo = page.getByTestId('gooey-cursor-highlight-demo');
  const blob = demo.locator('[data-gch-blob]');
  const box = await demo.boundingBox();
  if (!box) {
    throw new Error('demo has no box');
  }
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.move(box.x + 200, box.y + 120, { steps: 10 });
  const blobX = () => blob.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).e);
  await expect.poll(blobX).toBeGreaterThan(150);
  await expect(blob).toHaveCSS('width', '48px');
  const button = demo.getByRole('button', { name: 'A button' });
  await button.hover();
  await expect(button).toHaveAttribute('data-lit', '');
  const buttonWidth = await button.evaluate((el) => el.getBoundingClientRect().width);
  await expect.poll(() => blob.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(buttonWidth);
  await page.mouse.move(box.x + 20, box.y + 20);
  await expect(button).not.toHaveAttribute('data-lit');
  await expect.poll(() => blob.evaluate((el) => el.style.width)).toBe('48px');
});

test('split button opens into choices and collapses on select', async ({ page }) => {
  await page.goto('./split-button/');
  const demo = page.getByTestId('split-button-demo');
  await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  await demo.getByRole('button', { name: 'Share' }).click();
  await expect(demo.getByRole('button', { name: 'Back' })).toBeFocused();
  await expect(demo.getByRole('button', { name: 'Embed' })).toBeDisabled();
  await demo.getByRole('button', { name: 'Email' }).click();
  await expect(demo.getByRole('button', { name: 'Share' })).toBeFocused();
  await demo.getByRole('button', { name: 'Share' }).click();
  await page.keyboard.press('Escape');
  await expect(demo.getByRole('button', { name: 'Share' })).toBeVisible();
});

test('hold to delete fires only after a full hold', async ({ page }) => {
  await page.goto('./hold-to-delete-button/');
  const demo = page.getByTestId('hold-to-delete-button-demo');
  await demo.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  // Not found by name: the name follows the state.
  const button = demo.getByRole('button');
  await button.focus();
  // Let go early: nothing fires.
  await page.keyboard.down('Space');
  await expect(button).toHaveAccessibleName('Keep holding');
  await page.keyboard.up('Space');
  await expect(button).toHaveAccessibleName('Hold to delete');
  // Hold through the 2s timer.
  await page.keyboard.down('Space');
  await expect(button).toHaveAccessibleName('Deleted', { timeout: 3000 });
  await page.keyboard.up('Space');
  await expect(button).toHaveAttribute('data-state', 'done');
  await expect(button).toHaveAccessibleName('Hold to delete', { timeout: 3000 });
});

test('hold to delete blocks the long-press menu that would cancel a touch hold', async ({ page }) => {
  await page.goto('./hold-to-delete-button/');
  const demo = page.getByTestId('hold-to-delete-button-demo');
  await demo.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  const prevented = await demo
    .getByRole('button')
    .evaluate((button) => !button.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
  expect(prevented).toBe(true);
});

test('staggered text rolls from the hovered letter and back', async ({ page }) => {
  await page.goto('./staggered-text/');
  const demo = page.getByTestId('staggered-text-demo');
  await demo.locator('astro-island:not([ssr])').first().waitFor({ state: 'attached' });
  const heading = demo.getByRole('heading', { name: 'Hover every letter' });
  const rolls = heading.locator('.staggered-text-roll');
  const y = (roll: typeof rolls) => roll.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f);
  await rolls.first().hover();
  await expect.poll(() => y(rolls.first())).toBeLessThan(0);
  // The far end follows the near one.
  await expect.poll(() => y(rolls.last())).toBeLessThan(0);
  await page.mouse.move(0, 0);
  await expect.poll(() => y(rolls.last())).toBe(0);
});

test('morph surface opens, closes on escape and confirms a send', async ({ page }) => {
  await page.goto('./morph-surface/');
  const demo = page.getByTestId('morph-surface-demo');
  await demo.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  const trigger = demo.getByRole('button', { name: 'Ask AI' });
  const field = demo.getByRole('textbox', { name: 'AI Input' });
  await trigger.click();
  await expect(field).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(field).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await field.fill('Hello');
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect(demo.getByText('Sent')).toBeAttached();
  await expect(trigger).toBeFocused();
});

test('siri orb follows its size control', async ({ page }) => {
  await page.goto('./siri-orb/');
  const demo = page.getByTestId('siri-orb-demo');
  await demo.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  await demo.getByRole('slider', { name: 'size' }).fill('100');
  await expect(demo.locator('.siri-orb')).toHaveCSS('width', '100px');
});

test('elastic accordion keeps one row open and closes after its bounce', async ({ page }) => {
  await page.goto('./elastic-accordion/');
  const demo = page.getByTestId('accordion-demo');
  const rows = demo.locator('details');
  // The handlers attach from a module script; wait for it before clicking.
  await page.waitForLoadState();
  await demo.getByText('Why does it bounce?').click();
  await expect(rows.nth(1)).toHaveAttribute('open', '');
  // The first row stays mounted until its closing animation finishes.
  await expect(rows.first()).not.toHaveAttribute('open');
  await demo.getByText('Why does it bounce?').click();
  await expect(rows.nth(1)).toHaveAttribute('data-state', 'closed');
  await expect(rows.nth(1)).not.toHaveAttribute('open');
  await expect(rows.nth(1).getByText(/overshoots/u)).toBeHidden();
});

test('elastic accordion overshoots tall and narrow before settling', async ({ page }) => {
  await page.goto('./elastic-accordion/');
  const row = page.getByTestId('accordion-demo').locator('details').nth(1);
  await page.waitForLoadState();
  await row.locator('summary').click();
  // Freeze both animations at the spring's peak (~38% in), then let them land.
  const peak = await row.evaluate((el) => {
    for (const anim of el.getAnimations()) {
      anim.pause();
      anim.currentTime = 0.376 * Number(anim.effect?.getTiming().duration);
    }
    const { height, width } = el.getBoundingClientRect();
    for (const anim of el.getAnimations()) {
      anim.finish();
    }
    return { height, width };
  });
  const rest = await row.evaluate((el) => {
    const { height, width } = el.getBoundingClientRect();
    return { height, width };
  });
  expect(peak.height).toBeGreaterThan(rest.height);
  expect(peak.width).toBeLessThan(rest.width);
});

test('liquid glass calendar pages and picks days, and the stopwatch runs', async ({ page }) => {
  await page.goto('./liquid-glass-widgets/');
  const demo = page.getByTestId('liquid-glass-widgets-demo');
  await demo.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  const month = demo.locator('.glass-calendar-title');
  await expect(month).toHaveText(/^\w{3} \d{4}$/u);
  const before = (await month.textContent()) ?? '';
  await demo.getByRole('button', { name: 'Next month' }).click();
  await expect(month).not.toHaveText(before);
  const day = demo.getByRole('button', { name: / 15, \d{4}$/u });
  await expect(day).toHaveAttribute('aria-pressed', 'false');
  await day.click();
  await expect(day).toHaveAttribute('aria-pressed', 'true');

  const readout = demo.getByText(/^\d{2}:\d{2}\.\d{2}$/u);
  await expect(readout).toHaveText('00:00.00');
  await demo.getByRole('button', { name: 'Start stopwatch' }).click();
  await expect(readout).not.toHaveText('00:00.00');
  await demo.getByRole('button', { name: 'Pause stopwatch' }).click();
  await demo.getByRole('button', { name: 'Reset stopwatch' }).click();
  await expect(readout).toHaveText('00:00.00');
});

test('carousel keeps swiping after a swipe and after a control change', async ({ page }) => {
  await page.goto('./carousel/');
  await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
  // The container, not the track: the track's box moves with its translate.
  const container = page.locator('.carousel-container');
  const swipe = async () => {
    const box = await container.boundingBox();
    if (!box) {
      throw new Error('carousel not rendered');
    }
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.7, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, y, { steps: 8 });
    await page.mouse.up();
  };
  const current = page.locator('.carousel-indicator[aria-current="true"]');
  await swipe();
  await expect(current).toHaveAccessibleName('Go to slide 2');
  await swipe();
  await expect(current).toHaveAccessibleName('Go to slide 3');
  await page.getByRole('checkbox', { name: 'loop' }).check();
  await expect(current).toHaveAccessibleName('Go to slide 1');
  await swipe();
  await expect(current).toHaveAccessibleName('Go to slide 2');
});

test('siri orb controls fit inside their fieldset', async ({ page }) => {
  await page.goto('./siri-orb/');
  const controls = page.locator('.siri-orb-controls');
  await controls.waitFor();
  const fits = () => controls.evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(await fits()).toBe(true);
  await page.setViewportSize({ height: 844, width: 390 });
  expect(await fits()).toBe(true);
});

test.describe('on a touch phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { height: 844, width: 390 } });

  // iOS zooms the page into any focused field under 16px.
  test('morph surface field is large enough not to zoom on focus', async ({ page }) => {
    await page.goto('./morph-surface/');
    const demo = page.getByTestId('morph-surface-demo');
    await demo.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
    await demo.getByRole('button', { name: 'Ask AI' }).click();
    const field = demo.getByRole('textbox', { name: 'AI Input' });
    await expect(field).toBeFocused();
    await expect(field).toHaveCSS('font-size', '16px');
  });
});

test('experiment page carries canonical, social image and author structured data', async ({ page }) => {
  await page.goto('./carousel/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/experiments\/carousel\/$/u);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/previews\/carousel\.jpg$/u);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@type']).toBe('CreativeWork');
  expect(ld.author.name).toBe('Curtis Blanton');
});

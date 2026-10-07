# Minimal Site

Markdown-document-style Astro site: one layout, an index that lists entries, and a detail page per entry. Styled with [Shift CSS](https://getshiftcss.com/) (zero-runtime, modern CSS).

## Quick start

```sh
pnpm install
pnpm dev
```

Add entries as markdown files in `src/content/experiments/`:

```md
---
title: My Experiment
description: One-liner shown on the index.
pubDate: 2026-01-01
---

Content here.
```

### Rich experiments (MDX)

Use `.mdx` when an experiment needs components, HTML, CSS, or JS. Give it its own folder so its files live together; `<slug>/index.mdx` is served at `/<slug>/`:

```text
src/content/experiments/css-only-toggle/
├── index.mdx
└── Toggle.astro
```

```mdx
import Toggle from './Toggle.astro';

<Toggle />
```

- Put CSS and JS in an `.astro` component: `<style>` is scoped and `<script>` is bundled (TypeScript and imports work).
- Raw `<style>`/`<script>` written directly in MDX need their body wrapped in ``{`...`}`` and are emitted verbatim (not bundled, no imports).

Edit `src/consts.ts` for the site title and description.

## Scripts

| Script                             | What                                                      |
| ---------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                         | Dev server                                                |
| `pnpm build`                       | Production build (static `dist/`)                         |
| `pnpm test:unit` / `pnpm test:e2e` | Vitest / Playwright                                       |
| `pnpm lint:all`                    | ultracite + markdownlint + yamllint + actionlint + cspell |
| `pnpm deploy`                      | Build for Cloudflare and `wrangler deploy`                |

## Deploying

- **Vercel** — `vercel.json` is set up; import the repo.
- **Netlify** — `netlify.toml` is set up; import the repo.
- **Cloudflare** — `pnpm deploy` (wrangler).

## Toolchain

Managed by [mise](https://mise.jdx.dev) (`.config/mise.toml`): node, pnpm, actionlint, shellcheck, yamllint, betterleaks. Run `mise install` once. Git hooks (lefthook) install on `pnpm install`.

import { defineConfig } from 'oxlint';
import astro from 'ultracite/oxlint/astro';
import core from 'ultracite/oxlint/core';

export default defineConfig({
  extends: [core, astro],
  // Vendored agent skills (installed via skills-lock.json), not project code.
  ignorePatterns: [...(core.ignorePatterns ?? []), '.agents', '.claude/skills'],
  overrides: [
    {
      // Astro components are conventionally PascalCase.
      files: ['**/*.astro', '**/components/**/*.tsx', '**/content/experiments/**/*.tsx'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
  ],
});

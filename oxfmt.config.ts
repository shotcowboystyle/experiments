import { defineConfig } from 'oxfmt';
import ultracite from 'ultracite/oxfmt';

export default defineConfig({
  ...ultracite,
  // Vendored agent skills (installed via skills-lock.json), not project code.
  ignorePatterns: [...(ultracite.ignorePatterns ?? []), '.agents', '.claude/skills', 'skills-lock.json'],
  printWidth: 120,
  singleAttributePerLine: true,
  singleQuote: true,
});

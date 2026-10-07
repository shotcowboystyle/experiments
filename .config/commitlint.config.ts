import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'ci']],
  },
};

export default config;

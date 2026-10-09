module.exports = {
  ci: {
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    collect: {
      numberOfRuns: 2,
      // astro preview serves dist under the /experiments base; a plain static
      // server would put it at / and every asset URL would 404.
      startServerCommand: 'pnpm exec astro preview --port 4321',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:4321/experiments/', 'http://localhost:4321/experiments/siri-orb/'],
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

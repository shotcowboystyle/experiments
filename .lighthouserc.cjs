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
      staticDistDir: './dist',
      url: ['/', '/hello-world/'],
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

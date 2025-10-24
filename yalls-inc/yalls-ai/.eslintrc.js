module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    // Enforce no cross-section imports
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/apps/yallbrary/*', '@/apps/yalls-social/*', '@/apps/yallmart/*'],
            message: 'Cross-section imports forbidden. Use @/lib/shared instead.',
          },
        ],
      },
    ],
  },
};

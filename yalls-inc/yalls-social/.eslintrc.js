/**
 * Role: ESLint config for Yalls Social - enforce no cross-section imports
 * Path: yalls-inc/yalls-social/.eslintrc.js
 */

module.exports = {
  extends: ['../../eslint.config.js'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../../yalls-inc/yallbrary/**', '../../yalls-inc/yalls-ai/**'],
            message: 'Cross-section imports forbidden. Use _shared lib or explicit APIs only.',
          },
        ],
      },
    ],
  },
};

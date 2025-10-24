/**
 * Role: ESLint config for Yallmart - enforce no cross-section imports
 * Path: yalls-inc/yallmart/.eslintrc.js
 */

module.exports = {
  extends: ['../../eslint.config.js'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../../yalls-inc/yallbrary/**', '../../yalls-inc/yalls-social/**'],
            message: 'Cross-section imports forbidden. Use _shared lib or explicit APIs only.',
          },
        ],
      },
    ],
  },
};

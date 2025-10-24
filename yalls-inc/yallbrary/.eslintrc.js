/**
 * Role: ESLint config for Yallbrary - enforce no cross-section imports
 * Path: yalls-inc/yallbrary/.eslintrc.js
 */

module.exports = {
  extends: ['../../eslint.config.js'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../../yalls-inc/yallmart/**', '../../yalls-inc/yalls-social/**'],
            message: 'Cross-section imports forbidden. Use _shared lib only.',
          },
        ],
      },
    ],
  },
};

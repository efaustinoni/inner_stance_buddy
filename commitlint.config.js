export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow all conventional types
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
        'revert',
      ],
    ],
    // Subject must not start with uppercase / PascalCase
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    // Allow long body lines (we write detailed commit bodies)
    'body-max-line-length': [0],
    // Allow long footer lines (co-author lines can be long)
    'footer-max-line-length': [0],
  },
};

export default {
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {},
  overrides: [
    {
      files: ['**/__tests__/**/*.js'],
      env: { jest: true, node: true },
      rules: {},
    },
  ],
}

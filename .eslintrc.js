module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ['import', '@typescript-eslint', 'simple-import-sort'],
  extends: [
    'standard',
    'plugin:prettier/recommended',
    'plugin:node/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
}

module.exports = {
  extends: '../../.eslintrc.js',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.lint.json',
    sourceType: 'module',
  },
}

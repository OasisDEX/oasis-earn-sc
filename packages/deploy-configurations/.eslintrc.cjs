/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: ['./lib/**', './cache/**'],
  extends: ['@oasisdex/eslint-config/.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
}

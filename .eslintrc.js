/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    extends: [
      'next/core-web-vitals', // Includes 'next', 'eslint:recommended', and core web vitals rules
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:jsx-a11y/recommended',
      'plugin:prettier/recommended'
    ],
    plugins: ['@typescript-eslint', 'react', 'jsx-a11y'],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      // Customize your own rules here
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react/react-in-jsx-scope': 'off', // Next.js doesn't require react to be in scope
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  };

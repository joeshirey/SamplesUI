// eslint.config.js
const globals = require('globals');
const pluginJs = require('@eslint/js');
const pluginPrettier = require('eslint-plugin-prettier');
const configPrettier = require('eslint-config-prettier');
const jestPlugin = require('eslint-plugin-jest');

module.exports = [
    {
        ignores: ['node_modules/', '.env', '.env.sample'],
    },
    // Configuration for Node.js files (default)
    {
        files: ['**/*.js'],
        ignores: [
            'web/**/*.js',
            '__tests__/**/*.js',
            '__mocks__/**/*.js',
            'jest.setup.js',
        ],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.es2021,
            },
        },
        plugins: {
            prettier: pluginPrettier,
        },
        rules: {
            ...pluginJs.configs.recommended.rules,
            ...configPrettier.rules,
            'prettier/prettier': 'warn',
        },
    },
    // Configuration for Browser/Frontend files
    {
        files: ['web/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                hljs: 'readonly',
                marked: 'readonly',
            },
        },
        plugins: {
            prettier: pluginPrettier,
        },
        rules: {
            ...pluginJs.configs.recommended.rules,
            ...configPrettier.rules,
            'prettier/prettier': 'warn',
        },
    },
    // Configuration for Jest test files
    {
        files: ['__tests__/**/*.js', '__mocks__/**/*.js', 'jest.setup.js'],
        plugins: {
            jest: jestPlugin,
            prettier: pluginPrettier,
        },
        rules: {
            // Start with Jest's recommended rules
            ...jestPlugin.configs['flat/recommended'].rules,
            // Add Prettier's rules
            ...configPrettier.rules,
            // Add our Prettier warning rule
            'prettier/prettier': 'warn',
        },
        languageOptions: {
            globals: {
                // Define Jest's global variables
                ...globals.jest,
            },
        },
    },
];

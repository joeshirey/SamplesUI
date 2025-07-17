// eslint.config.js
const globals = require('globals');
const pluginJs = require('@eslint/js');
const pluginPrettier = require('eslint-plugin-prettier');
const configPrettier = require('eslint-config-prettier');

module.exports = [
    {
        ignores: ['node_modules/', '.env', '.env.sample'],
    },
    // Configuration for Node.js files (default)
    {
        files: ['**/*.js'],
        ignores: ['web/**/*.js'], // Correct way to ignore files in a config block
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
];

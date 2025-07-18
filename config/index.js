// config/index.js

/**
 * Centralized application configuration.
 * Loads environment variables from a .env file and exports a structured config object.
 * Provides a single source of truth for configuration values.
 */
require('dotenv').config();

const config = {
    port: process.env.PORT || 8080,
    bigquery: {
        projectId: process.env.PROJECT_ID,
        tableId: process.env.BIGQUERY_TABLE_ID,
    },
};

// Fail-fast validation for essential configuration, but not during tests.
if (process.env.NODE_ENV !== 'test' && !config.bigquery.tableId) {
    console.error(
        'FATAL ERROR: BIGQUERY_TABLE_ID is not defined in your .env file.'
    );
    process.exit(1);
}

module.exports = config;

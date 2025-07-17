// config/index.js
require('dotenv').config();

const config = {
    port: process.env.PORT || 8080,
    bigquery: {
        projectId: process.env.PROJECT_ID,
        tableId: process.env.BIGQUERY_TABLE_ID,
    },
};

// Validate essential configuration
if (!config.bigquery.tableId) {
    console.error(
        'FATAL ERROR: BIGQUERY_TABLE_ID is not defined in your .env file.'
    );
    process.exit(1);
}

module.exports = config;

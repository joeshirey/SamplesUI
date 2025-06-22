// server.js - Backend for Code Quality Dashboard

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('web'));

// --- Google Cloud Setup ---
const bigquery = new BigQuery({
    projectId: process.env.PROJECT_ID, // Explicitly set projectId from .env
});
const table = process.env.BIGQUERY_TABLE_ID;

if (!table) {
    console.error('FATAL ERROR: BIGQUERY_TABLE_ID is not defined in your .env file.');
    process.exit(1);
}

// --- API Endpoints ---

// GET /api/config
app.get('/api/config', (req, res) => {
    try {
        const projectId = process.env.PROJECT_ID; // Use PROJECT_ID directly from env
        const bigqueryView = table;
        res.json({ projectId, bigqueryView });
    } catch (error) {
        console.error('ERROR fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch config', details: error.message });
    }
});

// GET /api/languages
app.get('/api/languages', async (req, res) => {
    const query = `SELECT DISTINCT sample_language FROM \`${table}\` ORDER BY sample_language`;
    try {
        const [rows] = await bigquery.query({ query });
        const languages = rows.map(row => row.sample_language);
        res.json(languages);
    } catch (error) {
        console.error('ERROR fetching languages:', error);
        res.status(500).json({ error: 'Failed to fetch languages from BigQuery', details: error.message });
    }
});

// GET /api/product-areas?language=<language>
app.get('/api/product-areas', async (req, res) => {
    const { language } = req.query;
    if (!language) {
        return res.status(400).json({ error: 'Language query parameter is required' });
    }
    const query = `
        SELECT
            product_area,
            COUNT(DISTINCT github_link) AS samples,
            ROUND(AVG(overall_compliance_score)) AS score
        FROM \`${table}\`
        WHERE sample_language = @language
        GROUP BY product_area
        ORDER BY samples DESC`;
    try {
        const [rows] = await bigquery.query({ query, params: { language } });
        res.json(rows);
    } catch (error) {
        console.error('ERROR fetching product areas:', error);
        res.status(500).json({ error: 'Failed to fetch product areas from BigQuery', details: error.message });
    }
});

// GET /api/region-tags?language=<language>&product_area=<product_area>
app.get('/api/region-tags', async (req, res) => {
    const { language, product_area } = req.query;
    if (!language || !product_area) {
        return res.status(400).json({ error: 'Language and product_area query parameters are required' });
    }
    const query = `
        SELECT unnested_region_tag, overall_compliance_score
        FROM (
            SELECT
                unnested_region_tag,
                overall_compliance_score,
                ROW_NUMBER() OVER(PARTITION BY unnested_region_tag ORDER BY evaluation_date DESC) as rn
            FROM \`${table}\`, UNNEST(region_tags) as unnested_region_tag
            WHERE sample_language = @language AND product_area = @product_area
        )
        WHERE rn = 1
        ORDER BY overall_compliance_score ASC`;
    try {
        const [rows] = await bigquery.query({ query, params: { language, product_area } });
        const formattedRows = rows.map(row => ({ name: row.unnested_region_tag, score: row.overall_compliance_score }));
        res.json(formattedRows);
    } catch (error) {
        console.error('ERROR fetching region tags:', error);
        res.status(500).json({ error: 'Failed to fetch region tags from BigQuery', details: error.message });
    }
});

// GET /api/details?language=<lang>&product_area=<pa>&region_tag=<rt>
app.get('/api/details', async (req, res) => {
    const { language, product_area, region_tag } = req.query;
    if (!language || !product_area || !region_tag) {
        return res.status(400).json({ error: 'Language, product_area, and region_tag query parameters are required' });
    }
    const query = `
        SELECT *
        FROM \`${table}\`
        WHERE 
            sample_language = @language 
            AND product_area = @product_area 
            AND @region_tag IN UNNEST(region_tags)
        ORDER BY evaluation_date DESC
        LIMIT 1`;
    try {
        const [rows] = await bigquery.query({ query, params: { language, product_area, region_tag } });
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Details not found for the given selection.' });
        }
        const details = rows[0];
        
        // FIXED: Safely parse the JSON data.
        try {
            // Attempt to parse the JSON string from BigQuery.
            details.evaluation_data_raw_json = JSON.parse(details.evaluation_data_raw_json);
        } catch (parseError) {
            console.error('ERROR parsing evaluation_data_raw_json:', parseError);
            // If parsing fails, send back an empty object for the raw data
            // so the frontend doesn't crash, but can show that data is missing.
            details.evaluation_data_raw_json = { error: "Failed to parse evaluation data." };
        }

        res.json(details);
    } catch (error) {
        console.error('ERROR fetching details:', error);
        res.status(500).json({ error: 'Failed to fetch details from BigQuery', details: error.message });
    }
});

// GET /api/fetch-code?url=<github_url>
app.get('/api/fetch-code', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL query parameter is required.' });
    }
    try {
        const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        const response = await fetch(rawUrl);
        if (!response.ok) {
            throw new Error(`GitHub returned status: ${response.status} ${response.statusText}`);
        }
        const code = await response.text();
        res.send(code);
    } catch (error) {
        console.error(`ERROR fetching from GitHub URL ${url}:`, error);
        res.status(500).json({ error: 'Failed to fetch code file from GitHub', details: error.message });
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

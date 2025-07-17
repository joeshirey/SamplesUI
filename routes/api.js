// routes/api.js

const express = require('express');
const router = express.Router();
const bigqueryService = require('../services/bigqueryService');

// --- API Endpoints ---

// GET /api/config
router.get('/config', (req, res) => {
    try {
        const projectId = process.env.PROJECT_ID;
        const bigqueryView = process.env.BIGQUERY_TABLE_ID;
        res.json({ projectId, bigqueryView });
    } catch (error) {
        console.error('ERROR fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch config', details: error.message });
    }
});

// GET /api/languages
router.get('/languages', async (req, res) => {
    try {
        const languages = await bigqueryService.getLanguages();
        res.json(languages);
    } catch (error) {
        console.error('ERROR fetching languages:', error);
        res.status(500).json({ error: 'Failed to fetch languages from BigQuery', details: error.message });
    }
});

// GET /api/product-areas?language=<language>
router.get('/product-areas', async (req, res) => {
    const { language } = req.query;
    if (!language) {
        return res.status(400).json({ error: 'Language query parameter is required' });
    }
    try {
        const productAreas = await bigqueryService.getProductAreas(language);
        res.json(productAreas);
    } catch (error) {
        console.error('ERROR fetching product areas:', error);
        res.status(500).json({ error: 'Failed to fetch product areas from BigQuery', details: error.message });
    }
});

// GET /api/region-tags?language=<language>&product_name=<product_name>
router.get('/region-tags', async (req, res) => {
    const { language, product_name } = req.query;
    if (!language || !product_name) {
        return res.status(400).json({ error: 'Language and product_name query parameters are required' });
    }
    try {
        const regionTags = await bigqueryService.getRegionTags(language, product_name);
        res.json(regionTags);
    } catch (error) {
        console.error('ERROR fetching region tags:', error);
        res.status(500).json({ error: 'Failed to fetch region tags from BigQuery', details: error.message });
    }
});

// GET /api/details?language=<lang>&product_name=<pa>&region_tag=<rt>
router.get('/details', async (req, res) => {
    const { language, product_name, region_tag } = req.query;
    if (!language || !product_name || !region_tag) {
        return res.status(400).json({ error: 'Language, product_name, and region_tag query parameters are required' });
    }
    try {
        const details = await bigqueryService.getDetails(language, product_name, region_tag);
        if (!details) {
            return res.status(404).json({ error: 'Details not found for the given selection.' });
        }
        res.json(details);
    } catch (error) {
        console.error('ERROR fetching details:', error);
        res.status(500).json({ error: 'Failed to fetch details from BigQuery', details: error.message });
    }
});

// GET /api/fetch-code?url=<github_url>
router.get('/fetch-code', async (req, res) => {
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

module.exports = router;

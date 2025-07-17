// routes/api.js

const express = require('express');
const router = express.Router();
const bigqueryService = require('../services/bigqueryService');
const config = require('../config');

// --- API Endpoints ---

// GET /api/config
// Errors are now handled by the centralized error handler
router.get('/config', (req, res) => {
    res.json({ 
        projectId: config.bigquery.projectId, 
        bigqueryView: config.bigquery.tableId 
    });
});

// GET /api/languages
// Errors are now handled by the centralized error handler
router.get('/languages', async (req, res) => {
    const languages = await bigqueryService.getLanguages();
    res.json(languages);
});

// GET /api/product-areas?language=<language>
// Errors are now handled by the centralized error handler
router.get('/product-areas', async (req, res) => {
    const { language } = req.query;
    if (!language) {
        return res.status(400).json({ error: 'Language query parameter is required' });
    }
    const productAreas = await bigqueryService.getProductAreas(language);
    res.json(productAreas);
});

// GET /api/region-tags?language=<language>&product_name=<product_name>
// Errors are now handled by the centralized error handler
router.get('/region-tags', async (req, res) => {
    const { language, product_name } = req.query;
    if (!language || !product_name) {
        return res.status(400).json({ error: 'Language and product_name query parameters are required' });
    }
    const regionTags = await bigqueryService.getRegionTags(language, product_name);
    res.json(regionTags);
});

// GET /api/details?language=<lang>&product_name=<pa>&region_tag=<rt>
// Errors are now handled by the centralized error handler
router.get('/details', async (req, res) => {
    const { language, product_name, region_tag } = req.query;
    if (!language || !product_name || !region_tag) {
        return res.status(400).json({ error: 'Language, product_name, and region_tag query parameters are required' });
    }
    const details = await bigqueryService.getDetails(language, product_name, region_tag);
    if (!details) {
        return res.status(404).json({ error: 'Details not found for the given selection.' });
    }
    res.json(details);
});

// GET /api/fetch-code?url=<github_url>
// Errors are now handled by the centralized error handler
router.get('/fetch-code', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL query parameter is required.' });
    }
    const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    const response = await fetch(rawUrl);
    if (!response.ok) {
        // Create an error object to be caught by the central handler
        const error = new Error(`GitHub returned status: ${response.status} ${response.statusText}`);
        error.status = response.status;
        throw error;
    }
    const code = await response.text();
    res.send(code);
});

module.exports = router;
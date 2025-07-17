// routes/api.js

const express = require('express');
const router = express.Router();
const bigqueryService = require('../services/bigqueryService');
const config = require('../config');

// --- API Endpoints ---

// GET /api/config
router.get('/config', (req, res) => {
    res.json({ 
        projectId: config.bigquery.projectId, 
        bigqueryView: config.bigquery.tableId 
    });
});

// GET /api/languages
router.get('/languages', async (req, res, next) => {
    try {
        const languages = await bigqueryService.getLanguages();
        res.json(languages);
    } catch (error) {
        next(error);
    }
});

// GET /api/product-areas?language=<language>
router.get('/product-areas', async (req, res, next) => {
    try {
        const { language } = req.query;
        if (!language) {
            return res.status(400).json({ error: 'Language query parameter is required' });
        }
        const productAreas = await bigqueryService.getProductAreas(language);
        res.json(productAreas);
    } catch (error) {
        next(error);
    }
});

// GET /api/region-tags?language=<language>&product_name=<product_name>
router.get('/region-tags', async (req, res, next) => {
    try {
        const { language, product_name } = req.query;
        if (!language || !product_name) {
            return res.status(400).json({ error: 'Language and product_name query parameters are required' });
        }
        const regionTags = await bigqueryService.getRegionTags(language, product_name);
        res.json(regionTags);
    } catch (error) {
        next(error);
    }
});

// GET /api/details?language=<lang>&product_name=<pa>&region_tag=<rt>
router.get('/details', async (req, res, next) => {
    try {
        const { language, product_name, region_tag } = req.query;
        if (!language || !product_name || !region_tag) {
            return res.status(400).json({ error: 'Language, product_name, and region_tag query parameters are required' });
        }
        const details = await bigqueryService.getDetails(language, product_name, region_tag);
        if (!details) {
            return res.status(404).json({ error: 'Details not found for the given selection.' });
        }
        res.json(details);
    } catch (error) {
        next(error);
    }
});

// GET /api/fetch-code?url=<github_url>
router.get('/fetch-code', async (req, res, next) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL query parameter is required.' });
        }
        const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        const response = await fetch(rawUrl);
        if (!response.ok) {
            const error = new Error(`GitHub returned status: ${response.status} ${response.statusText}`);
            error.status = response.status;
            throw error;
        }
        const code = await response.text();
        res.send(code);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
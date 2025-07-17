// routes/api.js

/**
 * Defines all API routes for the application.
 * This router is mounted in server.js under the /api prefix.
 * Route handlers are responsible for input validation and calling the appropriate service.
 */
const express = require('express');
const router = express.Router();
const bigqueryService = require('../services/bigqueryService');
const config = require('../config');

// Provides public configuration to the frontend.
router.get('/config', (req, res) => {
    res.json({
        projectId: config.bigquery.projectId,
        bigqueryView: config.bigquery.tableId,
    });
});

// Fetches a list of all available programming languages.
router.get('/languages', async (req, res, next) => {
    try {
        const languages = await bigqueryService.getLanguages();
        res.json(languages);
    } catch (error) {
        next(error); // Pass errors to the centralized handler.
    }
});

// Fetches product areas for a specified language.
router.get('/product-areas', async (req, res, next) => {
    try {
        const { language } = req.query;
        if (!language) {
            return res
                .status(400)
                .json({ error: 'Language query parameter is required' });
        }
        const productAreas = await bigqueryService.getProductAreas(language);
        res.json(productAreas);
    } catch (error) {
        next(error);
    }
});

// Fetches region tags for a given language and product area.
router.get('/region-tags', async (req, res, next) => {
    try {
        const { language, product_name } = req.query;
        if (!language || !product_name) {
            return res.status(400).json({
                error: 'Language and product_name query parameters are required',
            });
        }
        const regionTags = await bigqueryService.getRegionTags(
            language,
            product_name
        );
        res.json(regionTags);
    } catch (error) {
        next(error);
    }
});

// Fetches detailed evaluation data for a specific sample.
router.get('/details', async (req, res, next) => {
    try {
        const { language, product_name, region_tag } = req.query;
        if (!language || !product_name || !region_tag) {
            return res.status(400).json({
                error: 'Language, product_name, and region_tag query parameters are required',
            });
        }
        const details = await bigqueryService.getDetails(
            language,
            product_name,
            region_tag
        );
        if (!details) {
            return res
                .status(404)
                .json({ error: 'Details not found for the given selection.' });
        }
        res.json(details);
    } catch (error) {
        next(error);
    }
});

// Proxies a request to fetch raw code from a public GitHub URL to avoid client-side CORS issues.
router.get('/fetch-code', async (req, res, next) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res
                .status(400)
                .json({ error: 'URL query parameter is required.' });
        }
        // Transform the GitHub URL to its "raw" content equivalent.
        const rawUrl = url
            .replace('github.com', 'raw.githubusercontent.com')
            .replace('/blob/', '/');
        const response = await fetch(rawUrl);
        if (!response.ok) {
            const error = new Error(
                `GitHub returned status: ${response.status} ${response.statusText}`
            );
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

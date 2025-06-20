// A simple Express server to handle API requests and serve the frontend.
const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');

const app = express();
const port = process.env.PORT || 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Static File Serving ---
app.use(express.static('web'));
// -------------------------

// Initialize BigQuery client
const bigquery = new BigQuery();

// Get the table ID from an environment variable for security
const tableId = process.env.BIGQUERY_TABLE_ID;

// --- API Endpoints ---

// Helper function to check for configuration errors
function checkConfig(req, res) {
    if (!tableId || tableId.includes('your-project')) {
        const errorMsg = "The BIGQUERY_TABLE_ID environment variable has not been set correctly on the server. Please check the Cloud Run service configuration.";
        console.error("FATAL: " + errorMsg);
        res.status(500).json({
            error: "Server Configuration Error",
            details: errorMsg
        });
        return false;
    }
    return true;
}


app.get('/api/languages', async (req, res) => {
    if (!checkConfig(req, res)) return;
    try {
        const query = `SELECT DISTINCT sample_language FROM \`${tableId}\` ORDER BY sample_language;`;
        const [rows] = await bigquery.query({ query });
        res.json(rows);
    } catch (error) {
        console.error('Failed to fetch languages:', error);
        res.status(500).json({ error: 'Failed to fetch languages from BigQuery.', details: error.message });
    }
});

app.get('/api/product-areas/:language', async (req, res) => {
    if (!checkConfig(req, res)) return;
    const { language } = req.params;
    try {
        const query = `
            SELECT
                product_area,
                COUNT(DISTINCT github_link) AS sample_count,
                ROUND(AVG(overall_compliance_score), 2) AS average_score
            FROM \`${tableId}\`
            WHERE sample_language = @language
            GROUP BY product_area
            ORDER BY sample_count DESC;
        `;
        const [rows] = await bigquery.query({
            query,
            params: { language }
        });
        res.json(rows);
    } catch (error) {
        console.error(`Failed to fetch product areas for ${language}:`, error);
        res.status(500).json({ error: 'Failed to fetch product areas.', details: error.message });
    }
});

app.get('/api/region-tags/:language/:productArea', async (req, res) => {
    if (!checkConfig(req, res)) return;
    const { language, productArea } = req.params;
    try {
        const query = `
            SELECT
                tag,
                MAX(t.overall_compliance_score) as overall_compliance_score
            FROM \`${tableId}\` AS t,
            UNNEST(region_tags) AS tag
            WHERE t.sample_language = @language
            AND t.product_area = @productArea
            GROUP BY tag
            ORDER BY overall_compliance_score ASC;
        `;
        const [rows] = await bigquery.query({
            query,
            params: { language, productArea }
        });
        res.json(rows);
    } catch (error) {
        console.error(`Failed to fetch region tags for ${productArea}:`, error);
        res.status(500).json({ error: 'Failed to fetch region tags.', details: error.message });
    }
});


app.get('/api/details/:language/:productArea/:regionTag', async (req, res) => {
    if (!checkConfig(req, res)) return;
    const { language, productArea, regionTag } = req.params;

    try {
        const query = `
            SELECT *
            FROM \`${tableId}\`
            WHERE sample_language = @language
                AND product_area = @productArea
                AND @regionTag IN UNNEST(region_tags)
            ORDER BY evaluation_date DESC
            LIMIT 1;
        `;
        const [rows] = await bigquery.query({
            query,
            params: { language, productArea, regionTag }
        });

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Details not found for the specified tag.' });
        }

        const details = rows[0];

        try {
            if (details.evaluation_data_raw_json) {
                details.evaluation_data_raw_json = JSON.parse(details.evaluation_data_raw_json);
            }
        } catch(jsonError) {
            console.error('Could not parse evaluation_data_raw_json:', jsonError);
        }

        res.json(details);
    } catch (error) {
        console.error(`Failed to fetch details for ${regionTag}:`, error);
        res.status(500).json({ error: 'Failed to fetch details.', details: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

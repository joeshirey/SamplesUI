const { BigQuery } = require('@google-cloud/bigquery');
const config = require('../config');

// --- Google Cloud Setup ---
const bigquery = new BigQuery({
    projectId: config.bigquery.projectId,
});
const table = config.bigquery.tableId;

// --- Service Functions ---

async function getLanguages() {
    const query = `SELECT DISTINCT sample_language FROM \`${table}\` ORDER BY sample_language`;
    const [rows] = await bigquery.query({ query });
    return rows.map((row) => row.sample_language);
}

async function getProductAreas(language) {
    const query = `
        SELECT
            product_name,
            COUNT(DISTINCT github_link) AS samples,
            ROUND(AVG(overall_compliance_score)) AS score
        FROM \`${table}\`
        WHERE sample_language = @language
        GROUP BY product_name
        ORDER BY samples DESC`;
    const [rows] = await bigquery.query({ query, params: { language } });
    return rows;
}

async function getRegionTags(language, product_name) {
    const query = `
        SELECT unnested_region_tag, overall_compliance_score
        FROM (
            SELECT
                unnested_region_tag,
                overall_compliance_score,
                ROW_NUMBER() OVER(PARTITION BY unnested_region_tag ORDER BY evaluation_date DESC, github_link DESC) as rn
            FROM \`${table}\`, UNNEST(region_tags) as unnested_region_tag
            WHERE sample_language = @language AND product_name = @product_name
        )
        WHERE rn = 1
        ORDER BY overall_compliance_score ASC`;
    const [rows] = await bigquery.query({
        query,
        params: { language, product_name },
    });
    return rows.map((row) => ({
        name: row.unnested_region_tag,
        score: row.overall_compliance_score,
    }));
}

async function getDetails(language, product_name, region_tag) {
    const query = `
        SELECT *
        FROM \`${table}\`
        WHERE 
            sample_language = @language 
            AND product_name = @product_name 
            AND @region_tag IN UNNEST(region_tags)
        ORDER BY evaluation_date DESC, github_link DESC
        LIMIT 1`;
    const [rows] = await bigquery.query({
        query,
        params: { language, product_name, region_tag },
    });
    if (rows.length === 0) {
        return null;
    }
    const details = rows[0];
    try {
        details.evaluation_data_raw_json = JSON.parse(
            details.evaluation_data_raw_json
        );
    } catch (parseError) {
        console.error('ERROR parsing evaluation_data_raw_json:', parseError);
        details.evaluation_data_raw_json = {
            error: 'Failed to parse evaluation data.',
        };
    }
    return details;
}

module.exports = {
    getLanguages,
    getProductAreas,
    getRegionTags,
    getDetails,
};

// services/bigqueryService.js

/**
 * This service module encapsulates all interactions with Google BigQuery.
 * It provides a set of functions that abstract the underlying SQL queries,
 * making the route handlers cleaner and separating data access logic from
 * the API layer. This is a common pattern for creating scalable and maintainable
 * applications, often referred to as a "data access layer" or "service layer".
 */
const { BigQuery } = require('@google-cloud/bigquery');
const config = require('../config');

// --- Google Cloud Setup ---

// Initialize the BigQuery client using the project ID from the configuration.
// The client will automatically use Application Default Credentials (ADC) for authentication.
// ADC is a strategy that allows your application to automatically find credentials
// based on the environment it's running in (e.g., a Google Cloud VM, local gcloud auth).
const bigquery = new BigQuery({
    projectId: config.bigquery.projectId,
});

// Retrieve the fully-qualified BigQuery table ID from the application's configuration.
// This makes the service reusable across different environments (dev, prod)
// by simply changing the configuration.
const table = config.bigquery.tableId;

// --- Service Functions ---

/**
 * Fetches a distinct list of all programming languages from the BigQuery table.
 * This is used to populate the language selection dropdown on the frontend.
 * @returns {Promise<string[]>} A promise that resolves to an array of language names (e.g., ['javascript', 'python']).
 */
async function getLanguages() {
    // This SQL query selects the unique values from the 'sample_language' column.
    // Using template literals to inject the table name makes the query dynamic.
    const query = `SELECT DISTINCT sample_language FROM \`${table}\` ORDER BY sample_language`;

    // The bigquery.query() method sends the query to the BigQuery API.
    // It returns a promise that resolves to an array, where the first element is the array of rows.
    // We use destructuring `[rows]` to directly access this array of results.
    const [rows] = await bigquery.query({ query });

    // The rows returned from BigQuery are objects. We use .map() to transform the array
    // of row objects into a simple array of strings, each containing a language name.
    return rows.map((row) => row.sample_language);
}

/**
 * Fetches product areas for a given language, including an aggregated score
 * and the total number of samples for each area.
 * @param {string} language - The programming language to filter by (e.g., 'javascript').
 * @returns {Promise<object[]>} A promise that resolves to an array of product area objects.
 * Each object contains `product_name`, `samples` (count), and `score` (average).
 */
async function getProductAreas(language) {
    // This query aggregates data for a specific language.
    // - COUNT(DISTINCT github_link) counts the unique samples.
    // - ROUND(AVG(overall_compliance_score)) calculates the average score.
    // - The `@language` syntax denotes a named parameter, which is a security best practice
    //   to prevent SQL injection attacks.
    const query = `
        SELECT
            product_name,
            COUNT(DISTINCT github_link) AS samples,
            ROUND(AVG(overall_compliance_score)) AS score
        FROM \`${table}\`
        WHERE sample_language = @language
        GROUP BY product_name
        ORDER BY samples DESC`;

    // The `params` object maps the named parameter in the query (`@language`)
    // to the value passed into the function.
    const [rows] = await bigquery.query({ query, params: { language } });
    return rows;
}

/**
 * Fetches the latest compliance score for each region tag within a given
 * language and product area.
 * @param {string} language - The programming language to filter by.
 * @param {string} product_name - The product area to filter by.
 * @returns {Promise<object[]>} A promise that resolves to an array of region tag objects,
 * each containing `name` and `score`.
 */
async function getRegionTags(language, product_name) {
    // This is a more complex query that uses a window function (`ROW_NUMBER()`)
    // to find the most recent evaluation for each region tag.
    // - `UNNEST(region_tags)` expands the `region_tags` array into individual rows.
    // - `ROW_NUMBER() OVER(...)` assigns a rank to each row within a partition (group)
    //   of `unnested_region_tag`, ordered by the evaluation date and github_link descending.
    //   The github_link is added as a tie-breaker for deterministic ordering.
    // - The outer query `WHERE rn = 1` then selects only the top-ranked (most recent) row for each tag.
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

    // The data is reshaped here to provide a cleaner, more consistent object structure
    // for the frontend. This decouples the frontend's data needs from the database schema.
    return rows.map((row) => ({
        name: row.unnested_region_tag,
        score: row.overall_compliance_score,
    }));
}

/**
 * Fetches the complete, most recent evaluation details for a specific sample,
 * identified by its language, product area, and a containing region tag.
 * @param {string} language - The programming language of the sample.
 * @param {string} product_name - The product area of the sample.
 * @param {string} region_tag - A region tag present in the sample.
 * @returns {Promise<object|null>} A promise that resolves to the detailed data object, or null if not found.
 */
async function getDetails(language, product_name, region_tag) {
    // This query retrieves all columns (`SELECT *`) for the single most recent sample
    // that matches the given criteria.
    // - `@region_tag IN UNNEST(region_tags)` checks if the given tag exists in the array of tags for a sample.
    // - `ORDER BY evaluation_date DESC, github_link DESC` ensures only the very latest record is returned,
    //   using github_link as a deterministic tie-breaker.
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

    // If no matching record is found, return null. The API route handler will
    // typically translate this into a 404 Not Found response.
    if (rows.length === 0) {
        return null;
    }

    const details = rows[0];

    // The evaluation data is stored as a JSON string in BigQuery.
    // It must be parsed into a JavaScript object before being sent to the frontend.
    // A try...catch block is used to handle cases where the JSON might be malformed,
    // preventing the entire application from crashing.
    try {
        details.evaluation_data_raw_json = JSON.parse(
            details.evaluation_data_raw_json
        );
    } catch (parseError) {
        // If parsing fails, log the error for debugging and return a structured
        // error object to the frontend so it can handle it gracefully.
        console.error('ERROR parsing evaluation_data_raw_json:', parseError);
        details.evaluation_data_raw_json = {
            error: 'Failed to parse evaluation data.',
        };
    }
    return details;
}

// Export the service functions to make them available to other parts of the application,
// primarily the API route handlers in `routes/api.js`.
module.exports = {
    getLanguages,
    getProductAreas,
    getRegionTags,
    getDetails,
};

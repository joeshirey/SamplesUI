// server.js

/**
 * Main application server.
 * Initializes Express, configures middleware, mounts API routes,
 * and starts the HTTP server.
 */
const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api');

const app = express();

// --- Middleware Setup ---
app.use(cors()); // Enable CORS for all origins.
app.use(express.json()); // Parse JSON request bodies.
app.use(express.static('web')); // Serve static frontend assets.

// --- API Routes ---
app.use('/api', apiRoutes); // Mount all API endpoints under the /api prefix.

// --- Centralized Error Handling ---
// A catch-all error handler. Any error passed to next() will be handled here.
// The `next` parameter is unused but required for Express to identify this as an error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('UNHANDLED ERROR:', err);
    res.status(500).json({
        error: 'An unexpected server error occurred.',
        details: err.message,
    });
});

// --- Server Initialization ---
app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});

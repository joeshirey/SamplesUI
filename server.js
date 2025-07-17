// server.js - Backend for Code Quality Dashboard

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api'); // Import the new router

const app = express();
const port = process.env.PORT || 8080;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('web'));

// --- Google Cloud Pre-check ---
// Fail fast if the essential BigQuery table ID is not configured.
if (!process.env.BIGQUERY_TABLE_ID) {
    console.error('FATAL ERROR: BIGQUERY_TABLE_ID is not defined in your .env file.');
    process.exit(1);
}

// --- API Routes ---
// All API routes are now handled by the api.js module
app.use('/api', apiRoutes);

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
// server.js - Backend for Code Quality Dashboard

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api'); // Import the new router

const app = express();
const port = config.port;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('web'));

// --- Google Cloud Pre-check ---
// The pre-check is now handled in the config module.

// --- API Routes ---
// All API routes are now handled by the api.js module
app.use('/api', apiRoutes);

// --- Centralized Error Handling ---
// This middleware catches any errors that occur in the route handlers.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('UNHANDLED ERROR:', err);
    res.status(500).json({ 
        error: 'An unexpected server error occurred.', 
        details: err.message 
    });
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
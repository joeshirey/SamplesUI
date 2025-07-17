// __tests__/routes/api.test.js
const request = require('supertest');
const express = require('express');
const apiRoutes = require('../../routes/api');
const bigqueryService = require('../../services/bigqueryService');

// Mock the bigqueryService
jest.mock('../../services/bigqueryService');

const app = express();
app.use('/api', apiRoutes);
// Add the centralized error handler to the test app
app.use((err, req, res, next) => {
    console.error('TEST-CAUGHT ERROR:', err.message); // Log for debugging test errors
    res.status(500).json({ 
        error: 'An unexpected server error occurred.', 
        details: err.message 
    });
});

describe('GET /api/languages', () => {
    it('should return a list of languages from the bigqueryService', async () => {
        const mockLanguages = ['Go', 'Java', 'Python'];
        bigqueryService.getLanguages.mockResolvedValue(mockLanguages);

        const response = await request(app).get('/api/languages');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockLanguages);
        expect(bigqueryService.getLanguages).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from the service layer', async () => {
        const errorMessage = 'BigQuery is unavailable';
        bigqueryService.getLanguages.mockRejectedValue(new Error(errorMessage));

        const response = await request(app).get('/api/languages');

        expect(response.statusCode).toBe(500);
        expect(response.body.error).toContain('An unexpected server error occurred');
    });
});

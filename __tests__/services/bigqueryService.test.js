// __tests__/services/bigqueryService.test.js
const { BigQuery } = require('@google-cloud/bigquery');
const bigqueryService = require('../../services/bigqueryService');

// Mock the BigQuery client
jest.mock('@google-cloud/bigquery');

const mockQuery = BigQuery.mockQuery;

describe('bigqueryService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getDetails', () => {
        it('should return null if no rows are found', async () => {
            mockQuery.mockResolvedValue([[]]); // Simulate no rows returned
            const result = await bigqueryService.getDetails('Go', 'Cloud Run', 'tag');
            expect(result).toBeNull();
        });

        it('should return parsed details if a row is found', async () => {
            const mockRow = {
                evaluation_data_raw_json: '{"passed": true}',
                other_data: 'some value',
            };
            mockQuery.mockResolvedValue([[mockRow]]);

            const result = await bigqueryService.getDetails('Go', 'Cloud Run', 'tag');

            expect(result).toEqual({
                evaluation_data_raw_json: { passed: true },
                other_data: 'some value',
            });
        });

        it('should handle JSON parsing errors gracefully', async () => {
            const mockRow = {
                evaluation_data_raw_json: 'invalid json',
            };
            mockQuery.mockResolvedValue([[mockRow]]);

            const result = await bigqueryService.getDetails('Go', 'Cloud Run', 'tag');

            expect(result.evaluation_data_raw_json.error).toBe('Failed to parse evaluation data.');
        });
    });
});

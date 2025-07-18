// jest.setup.js

// Set dummy environment variables required by the application for the test environment.
// This prevents the configuration from failing and ensures tests run in a consistent state.
process.env.BIGQUERY_TABLE_ID = 'test-project.test_dataset.test_table';
process.env.PROJECT_ID = 'test-project';

beforeAll(() => {
    // Mock console.error to prevent logging expected errors during tests,
    // such as the graceful JSON parsing error in the BigQuery service.
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    // Restore original console.error after all tests are complete.
    console.error.mockRestore();
});
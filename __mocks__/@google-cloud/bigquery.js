// __mocks__/@google-cloud/bigquery.js
const mockQuery = jest.fn();

const BigQuery = jest.fn(() => ({
    query: mockQuery,
}));

BigQuery.mockQuery = mockQuery;

module.exports = { BigQuery };

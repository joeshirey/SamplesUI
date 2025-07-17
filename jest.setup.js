// jest.setup.js
beforeAll(() => {
    // Mock console.error to prevent logging expected errors during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    // Restore original console.error after all tests
    console.error.mockRestore();
});

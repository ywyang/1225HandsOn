// Test setup file for Jest
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Setup test database or other global test configuration
});

afterAll(async () => {
  // Cleanup after all tests
});

// Global test utilities
global.testUtils = {
  // Add common test utilities here
};
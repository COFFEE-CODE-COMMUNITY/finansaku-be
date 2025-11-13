export default {
  testEnvironment: 'node',
  transform: {},                 // native ESM
  verbose: true,
  testTimeout: 15000,
  moduleFileExtensions: ['js', 'json'],
  maxWorkers: 1,
  roots: ['<rootDir>/__tests__'],

  // ✅ run after the Jest environment is ready (beforeAll/afterAll available)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // make sure only *.test.js are picked up
  testMatch: ['**/__tests__/**/*.test.js'],

  // ignore helper utilities so “must contain at least one test” won’t fire
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
}

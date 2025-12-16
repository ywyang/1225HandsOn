export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/__tests__/**/*.(js|ts)',
    '**/?(*.)+(spec|test).(js|ts)'
  ],
  collectCoverageFrom: [
    'src/**/*.(js|ts)',
    '!src/**/*.(test|spec).(js|ts)'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};
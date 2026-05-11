const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

// next/jest prepends its own '/node_modules/' pattern which blocks any
// per-package exclusions we add. Wrap the resolved config to replace
// transformIgnorePatterns with one that lets ESM-only packages be
// transformed by SWC.
const nextJestConfig = createJestConfig(customConfig);
module.exports = async () => {
  const config = await nextJestConfig();
  config.transformIgnorePatterns = [
    // Transform these ESM-only packages; block everything else in node_modules.
    '/node_modules/(?!(bson|mongodb|mongodb-memory-server|mongodb-memory-server-core)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ];
  return config;
};

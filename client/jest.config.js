/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  // Default environment
  testEnvironment: 'node',
  testEnvironmentOptions: {
    // Use JSDOM only for files that need browser APIs
    customExportConditions: ['browser', 'node'],
  },
  coverageProvider: 'v8',
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        isolatedModules: true
      },
    ],
  },
  // Ignore setup files when looking for test suites
  testPathIgnorePatterns: ["/node_modules/", "setup.ts"],
  // Make sure TypeScript is properly configured for tests
  preset: "ts-jest",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "mjs"],
  // Handle import.meta.env for Vite compatibility
  transformIgnorePatterns: [
    "/node_modules/(?!(.+mjs$|string-width|strip-ansi|ansi-regex|vite|@testing-library))"
  ],
  moduleNameMapper: {
    "import\\.meta": "<rootDir>/src/__mocks__/importMeta.js",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
  },
  // Coverage configuration
  collectCoverage: false, // Set to true to always collect coverage
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    '!src/utils/eventTester.ts',
    '!src/utils/apiInspector.ts',
    '!src/utils/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 65,
      functions: 75,
      lines: 75
    }
  },
  // Per-file environment configuration
  projects: [
    {
      displayName: 'browser',
      testMatch: [
        '<rootDir>/src/utils/__tests__/routing.test.ts',
        '<rootDir>/src/utils/__tests__/adminUser.test.ts'
        // Add other tests that need browser environment
      ],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'node',
      testMatch: [
        '<rootDir>/src/utils/__tests__/**/*.test.ts',
        '<rootDir>/src/utils/__tests__/**/*.test.js'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/utils/__tests__/routing.test.ts',
        '<rootDir>/src/utils/__tests__/adminUser.test.ts'
      ],
      testEnvironment: 'node'
    }
  ]
};

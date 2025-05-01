/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  // Ignore setup files when looking for test suites
  testPathIgnorePatterns: ["/node_modules/", "setup.ts"],
  // Make sure TypeScript is properly configured for tests
  preset: "ts-jest",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // Handle import.meta.env for Vite compatibility
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
  moduleNameMapper: {
    "import\\.meta": "<rootDir>/src/__mocks__/importMeta.js",
  },
};

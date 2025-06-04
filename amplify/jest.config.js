/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  // Ignore setup files when looking for test suites
  testPathIgnorePatterns: ["/node_modules/", "setup.ts"],
  // Make sure TypeScript is properly configured for tests
  preset: "ts-jest",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // Allow virtual modules for tests
  moduleDirectories: ["node_modules", "<rootDir>"],
};

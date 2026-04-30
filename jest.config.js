const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "lib/**/*.ts",
    "components/**/*.tsx",
    "app/api/**/*.ts",
    "!lib/scoring/claudeStrategy.ts",
  ],
});

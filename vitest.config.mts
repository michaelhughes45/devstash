import { defineConfig } from "vitest/config";

// Unit tests for server actions and utilities only; components are covered by E2E tests
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    mockReset: true,
    restoreMocks: true,
    unstubEnvs: true,
  },
});

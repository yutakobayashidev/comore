import baseViteConfig from "./vite.config";
import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig(() =>
  mergeConfig(
    baseViteConfig,
    defineConfig({
      test: {
        globals: true,
        mockReset: true,
        restoreMocks: true,
        clearMocks: true,
        include: ["./app/**/*.test.{ts,tsx}"],
        setupFiles: ["./tests/vitest.setup.ts"],
        globalSetup: "./tests/vitest.global.setup.ts",
      },
    }),
  ),
);

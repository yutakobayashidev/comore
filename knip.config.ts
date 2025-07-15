import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreUnresolved: ["\\+types/.+"],
  paths: {
    "~/database/*": ["./database/*"],
    "~/*": ["./app/*"],
  },
  ignore: [
    "eslint.config.js",
    "worker-configuration.d.ts",
    "workers/app.ts",
    "app/components/ui/**",
    "app/hooks/use-mobile.ts",
    "app/lib/utils.ts",
    "app/lib/auth/session/index.ts",
    ".claude/hooks/auto-commit-script.js",
  ],
  "react-router": {
    config: [
      "react-router.config.{js,ts}",
      "vite.config.{js,mjs,ts,cjs,mts,cts}",
    ],
  },
  vitest: {
    entry: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.ts"],
  },
  ignoreBinaries: ["stripe"],
  ignoreDependencies: [
    "tailwindcss",
    "@react-router/node",
    "@secretlint/secretlint-rule-preset-recommend",
    "@hookform/resolvers",
    "cmdk",
    "date-fns",
    "embla-carousel-react",
    "input-otp",
    "next-themes",
    "react-day-picker",
    "react-hook-form",
    "react-resizable-panels",
    "recharts",
    "sonner",
    "vaul",
    "zod",
    "tw-animate-css",
    "@testing-library/dom",
    "@testing-library/react",
  ],
};

export default config;

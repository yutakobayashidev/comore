import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreUnresolved: ["\\+types/.+"],
  ignore: ["eslint.config.js", "worker-configuration.d.ts", "workers/app.ts"],
  ignoreDependencies: [
    "tailwindcss",
    "eslint-plugin-oxlint",
    "@react-router/node",
    "@secretlint/secretlint-rule-preset-recommend",
  ],
  ignoreBinaries: ["oxlint", "eslint"],
};

export default config;

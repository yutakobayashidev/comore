import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreUnresolved: [
    '\\+types/.+',
  ],
  ignore: ["eslint.config.js"],
  ignoreDependencies: [
    "tailwindcss",
    "eslint-plugin-oxlint",
    "@react-router/node",
  ],
  ignoreBinaries: ["oxlint", "eslint"],
};

export default config;

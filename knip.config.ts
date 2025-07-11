import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: ["eslint.config.js", "./+types/root"],
  ignoreDependencies: [
    "tailwindcss",
    "eslint-plugin-oxlint",
    "isbot",
    "@react-router/node",
  ],
  ignoreBinaries: ["oxlint", "eslint"],
};

export default config;

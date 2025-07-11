import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreUnresolved: ["\\+types/.+"],
  ignore: [
    "eslint.config.js",
    "worker-configuration.d.ts",
    "workers/app.ts",
    "app/components/ui/**",
    "app/hooks/use-mobile.ts",
    "app/lib/utils.ts",
  ],
  ignoreDependencies: [
    "tailwindcss",
    "@react-router/node",
    "@secretlint/secretlint-rule-preset-recommend",
    "@hookform/resolvers",
    "class-variance-authority",
    "clsx",
    "cmdk",
    "date-fns",
    "embla-carousel-react",
    "input-otp",
    "lucide-react",
    "next-themes",
    "react-day-picker",
    "react-hook-form",
    "react-resizable-panels",
    "recharts",
    "sonner",
    "tailwind-merge",
    "vaul",
    "zod",
    "radix-ui",
    "tw-animate-css",
  ],
};

export default config;

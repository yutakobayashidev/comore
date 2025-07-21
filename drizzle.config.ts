import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({
  path: ".dev.vars",
});

export default process.env.LOCAL_DB_PATH
  ? ({
      schema: "./database/schema.ts",
      dbCredentials: {
        url: process.env.LOCAL_DB_PATH!,
      },
      dialect: "sqlite",
    } satisfies Config)
  : ({
      out: "./drizzle",
      schema: "./database/schema.ts",
      dialect: "sqlite",
      driver: "d1-http",
      dbCredentials: {
        databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        token: process.env.CLOUDFLARE_D1_TOKEN!,
      },
    } satisfies Config);

import type { Config } from "drizzle-kit";
import * as dotenv from 'dotenv';

dotenv.config();

export default process.env.LOCAL_DB_PATH
    ? ({
        schema: "./database/schema.ts",
        dbCredentials: {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            url: process.env.LOCAL_DB_PATH!,
        },
        dialect: "sqlite"
    } satisfies Config)
    : ({
        out: "./drizzle",
        schema: "./database/schema.ts",
        dialect: "sqlite",
        driver: "d1-http",
        dbCredentials: {
            databaseId: "1cfa312a-e613-43e0-af1a-29236fb340ba",
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
            token: process.env.CLOUDFLARE_D1_TOKEN!,
        },
    } satisfies Config);

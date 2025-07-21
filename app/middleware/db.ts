import { CloudflareContext } from "../middleware/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../database/schema";
import {
  unstable_createContext,
  type unstable_RouterContextProvider,
  type unstable_MiddlewareFunction as MiddlewareFunction,
} from "react-router";

let dbContext = unstable_createContext<DrizzleD1Database<typeof schema>>();

export let dbMiddleware: MiddlewareFunction = async ({ context }) => {
  let cloudflareEnv = context.get(CloudflareContext);

  let db = drizzle(cloudflareEnv.env.DB, {
    schema,
  });

  context.set(dbContext, db);
};

export function database(context: unstable_RouterContextProvider) {
  return context.get(dbContext);
}

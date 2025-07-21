import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import { d1HttpDriver } from "./d1-http-driver";
import * as schema from "../../../database/schema";

const wrappedDriver: AsyncRemoteCallback = async (
  sql: string,
  params: unknown[],
  method: "all" | "run" | "get" | "values",
) => {
  if (method === "values") {
    const result = await d1HttpDriver(sql, params, "all");
    return result;
  }
  return d1HttpDriver(sql, params, method);
};

const db = drizzle(wrappedDriver, { schema });

export default db;

export type DrizzleClient = typeof db;

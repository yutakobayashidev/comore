import ky from "ky";

const { CLOUDFLARE_D1_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID } =
  process.env;

if (!CLOUDFLARE_D1_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_DATABASE_ID) {
  throw new Error(
    "Missing required environment variables for D1 HTTP driver: CLOUDFLARE_D1_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID",
  );
}

const D1_API_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_DATABASE_ID}`;

const d1HttpClient = ky.create({
  prefixUrl: D1_API_BASE_URL,
  headers: {
    Authorization: `Bearer ${CLOUDFLARE_D1_TOKEN}`,
  },
});

interface D1QueryResult {
  success: boolean;
  errors: any[];
  result: Array<{
    success: boolean;
    results: any[];
    meta?: any;
  }>;
}

export const d1HttpDriver = async (
  sql: string,
  params: unknown[],
  method: "all" | "run" | "get",
) => {
  const res = await d1HttpClient.post("query", {
    json: { sql, params, method },
  });

  const data = (await res.json()) as D1QueryResult;

  if (data.errors?.length > 0 || !data.success) {
    throw new Error(
      `Error from sqlite proxy server: \n${JSON.stringify(data)}`,
    );
  }

  const qResult = data.result[0];

  if (!qResult || !qResult.success) {
    throw new Error(
      `Error from sqlite proxy server: \n${JSON.stringify(data)}`,
    );
  }

  // https://orm.drizzle.team/docs/get-started-sqlite#http-proxy
  return { rows: qResult.results.map((r: any) => Object.values(r)) };
};

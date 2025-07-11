import { generateState } from "arctic";
import { createGitHubOAuth } from "~/lib/oauth";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ context }: LoaderFunctionArgs) {
  const github = createGitHubOAuth(context.cloudflare.env);
  const state = generateState();
  const url = github.createAuthorizationURL(state, []);

  const response = new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": `github_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`,
    },
  });

  return response;
}

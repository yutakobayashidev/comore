import { generateState } from "arctic";
import { createGitHubOAuth } from "~/lib/auth/oauth";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectURI = `${url.origin}/login/github/callback`;
  const github = createGitHubOAuth(context.cloudflare.env, redirectURI);
  const state = generateState();
  const authUrl = github.createAuthorizationURL(state, ["user:email"]);

  const response = new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": `github_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${
        context.cloudflare.env.NODE_ENV === "production" ? "; Secure" : ""
      }`,
    },
  });

  return response;
}

import { type LoaderFunctionArgs, data } from "react-router";
import { createGitHubOAuth } from "~/lib/auth/oauth";
import {
  generateSessionToken,
  createSession,
  setSessionTokenCookie,
} from "~/lib/auth/session";
import { getUserFromGitHubId, createUser } from "~/lib/auth/user";
import { getSearchParams } from "~/utils/urls";
import { parseCookies } from "~/utils/cookies";
import type { OAuth2Tokens } from "arctic";
import { ObjectParser } from "@pilcrowjs/object-parser";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { code, state } = getSearchParams(request.url);

  const cookieHeader = request.headers.get("Cookie");
  const cookies = parseCookies(cookieHeader || "");
  const storedState = cookies.github_oauth_state || null;

  if (code === null || state === null || storedState === null) {
    throw data(null, { status: 400 });
  }

  if (state !== storedState) {
    throw data(null, { status: 400 });
  }

  const url = new URL(request.url);
  const redirectURI = `${url.origin}/login/github/callback`;
  const github = createGitHubOAuth(context.cloudflare.env, redirectURI);

  let tokens: OAuth2Tokens;
  try {
    tokens = await github.validateAuthorizationCode(code);
  } catch (e) {
    console.error("OAuth validation error:", e);
    throw data(null, { status: 400 });
  }

  const githubAccessToken = tokens.accessToken();

  const githubUserResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      "User-Agent": "comore-app",
    },
  });

  if (!githubUserResponse.ok) {
    const errorText = await githubUserResponse.text();
    console.error("GitHub API error:", errorText);
    throw data(null, { status: 400 });
  }

  const userResult: unknown = await githubUserResponse.json();
  const userParser = new ObjectParser(userResult);

  const githubId = userParser.getNumber("id");
  const handle = userParser.getString("login");

  const existingUser = await getUserFromGitHubId(context.db)(githubId);

  if (existingUser !== null) {
    const sessionToken = generateSessionToken();
    const session = await createSession(context.db)(
      sessionToken,
      existingUser.id,
    );

    const headers = new Headers({
      Location: "/",
    });

    headers.append(
      "Set-Cookie",
      setSessionTokenCookie(sessionToken, session.expiresAt),
    );

    return new Response(null, {
      status: 302,
      headers,
    });
  }

  const user = await createUser(context.db)({
    githubId,
    handle,
    email: "test@test.com", // TODO: fetch email
  });

  const sessionToken = generateSessionToken();
  const session = await createSession(context.db)(sessionToken, user.id);

  const headers = new Headers({
    Location: "/",
  });

  headers.append(
    "Set-Cookie",
    setSessionTokenCookie(sessionToken, session.expiresAt),
  );

  return new Response(null, {
    status: 302,
    headers,
  });
}

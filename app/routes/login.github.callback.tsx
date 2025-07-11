import { type LoaderFunctionArgs, data } from "react-router";
import { createGitHubOAuth } from "~/lib/oauth";
import {
  generateSessionToken,
  createSession,
  setSessionTokenCookie,
} from "~/lib/session";
import { getUserFromGitHubId, createUser } from "~/lib/user";
import type { OAuth2Tokens } from "arctic";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieHeader = request.headers.get("Cookie");
  const cookies = parseCookies(cookieHeader || "");
  const storedState = cookies.github_oauth_state || null;

  if (code === null || state === null || storedState === null) {
    throw data(null, { status: 400 });
  }

  if (state !== storedState) {
    throw data(null, { status: 400 });
  }

  const github = createGitHubOAuth(context.cloudflare.env);

  let tokens: OAuth2Tokens;
  try {
    tokens = await github.validateAuthorizationCode(code);
  } catch (e) {
    throw data(null, { status: 400 });
  }

  const githubUserResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const githubUser = await githubUserResponse.json();
  const githubUserId = githubUser.id;
  const githubUsername = githubUser.login;

  const existingUser = await getUserFromGitHubId(githubUserId);

  if (existingUser !== null) {
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, existingUser.id);

    const headers = new Headers({
      Location: "/",
    });

    headers.append(
      "Set-Cookie",
      await setSessionTokenCookie(sessionToken, session.expiresAt),
    );

    return new Response(null, {
      status: 302,
      headers,
    });
  }

  const user = await createUser(githubUserId, githubUsername);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);

  const headers = new Headers({
    Location: "/",
  });

  headers.append(
    "Set-Cookie",
    await setSessionTokenCookie(sessionToken, session.expiresAt),
  );

  return new Response(null, {
    status: 302,
    headers,
  });
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

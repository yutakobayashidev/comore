import { GitHub } from "arctic";

export function createGitHubOAuth(env: {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}) {
  const redirectURI = "http://localhost:5173/login/github/callback";
  return new GitHub(
    env.GITHUB_CLIENT_ID,
    env.GITHUB_CLIENT_SECRET,
    redirectURI,
  );
}

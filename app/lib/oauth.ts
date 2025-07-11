import { GitHub } from "arctic";

export function createGitHubOAuth(env: {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}) {
  return new GitHub(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, null);
}

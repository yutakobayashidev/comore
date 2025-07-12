import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login/github", "routes/login.github.tsx"),
  route("login/github/callback", "routes/login.github.callback.tsx"),
] satisfies RouteConfig;

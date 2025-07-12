import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [index("routes/home.tsx")]),
  route("login/github", "routes/login.github.tsx"),
  route("login/github/callback", "routes/login.github.callback.tsx"),
] satisfies RouteConfig;

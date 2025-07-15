import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("settings", "routes/settings.tsx"),
    route(":handle", "routes/profile.$handle.tsx"),
    route("me/payment", "routes/me.payment.tsx"),
  ]),
  route("login/github", "routes/login.github.tsx"),
  route("login/github/callback", "routes/login.github.callback.tsx"),
  route("payment/checkout", "routes/payment.checkout.tsx"),
  route("payment/complete", "routes/payment.complete.tsx"),
  route("api/payment/webhook", "routes/api.payment.webhook.tsx"),
] satisfies RouteConfig;

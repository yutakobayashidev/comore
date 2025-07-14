import Stripe from "stripe";

export function createStripeClient(env: { STRIPE_SECRET_KEY: string }) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export type StripeClient = ReturnType<typeof createStripeClient>;

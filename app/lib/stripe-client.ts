import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key should be passed from server or environment
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

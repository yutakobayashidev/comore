import { createStripeClient } from "~/lib/stripe";
import type { Route } from "./+types/api.payment.checkout";
import { data } from "react-router";

export async function action({ context, request }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const stripe = createStripeClient({
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  });

  const domain = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url: `${domain}/payment/complete?session_id={CHECKOUT_SESSION_ID}`,
    });

    return data({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return data(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

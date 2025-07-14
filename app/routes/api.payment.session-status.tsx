import { data } from "react-router";
import { createStripeClient } from "~/lib/stripe";
import type { Route } from "./+types/api.payment.webhook";

export async function loader({ context, request }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const stripe = createStripeClient({
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  });

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return data({ error: "Session ID is required" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const paymentIntent = session.payment_intent as any;

    return data({
      status: session.status,
      payment_status: session.payment_status,
      payment_intent_id: paymentIntent?.id,
      payment_intent_status: paymentIntent?.status,
    });
  } catch (error) {
    console.error("Failed to retrieve session:", error);
    return data({ error: "Failed to retrieve session" }, { status: 500 });
  }
}

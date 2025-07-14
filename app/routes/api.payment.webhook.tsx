import { data, type ActionFunctionArgs } from "react-router";
import { createStripeClient } from "~/lib/stripe";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const stripe = createStripeClient({
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  });

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return data({ error: "Missing stripe signature" }, { status: 400 });
  }

  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log("Payment succeeded:", session.id);
        // TODO: Handle successful payment (e.g., update database, send email)
        break;
      case "checkout.session.expired":
        console.log("Session expired:", event.data.object.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return data({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return data({ error: "Webhook error" }, { status: 400 });
  }
}

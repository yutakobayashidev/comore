import { data } from "react-router";
import { createStripeClient, handleSubscriptionUpsert } from "~/lib/stripe";
import { eq } from "drizzle-orm";
import { users, subscriptions } from "~/database/schema";
import type Stripe from "stripe";
import type { Route } from "./+types/api.payment.webhook";

export async function loader({ context, request }: Route.LoaderArgs) {
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

      case "customer.subscription.created":
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        try {
          await handleSubscriptionUpsert(context.db, subscription);
        } catch (error) {
          console.error("Error upserting subscription:", error);
          return data(
            { error: "Error upserting subscription" },
            { status: 500 },
          );
        }
        break;
      }

      case "customer.deleted": {
        const customer = event.data.object as Stripe.Customer;

        try {
          await context.db.transaction(async (tx) => {
            const user = await tx.query.users.findFirst({
              where: eq(users.stripeId, customer.id),
            });

            if (user) {
              // Delete all subscriptions for this user
              await tx
                .delete(subscriptions)
                .where(eq(subscriptions.userId, user.id));

              // Update user to remove stripeId
              await tx
                .update(users)
                .set({ stripeId: null })
                .where(eq(users.id, user.id));
            } else {
              console.warn(
                `No user found for customer deletion: ${customer.id}`,
              );
            }
          });
        } catch (error) {
          console.error("Error deleting customer:", error);
          return data({ error: "Error deleting customer" }, { status: 500 });
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return data({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return data({ error: "Webhook error" }, { status: 400 });
  }
}

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

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return data({ error: "Missing stripe signature" }, { status: 400 });
  }

  let rawBody: Buffer;

  try {
    rawBody = Buffer.from(await request.arrayBuffer());
  } catch {
    return data({ error: "Error reading request body" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return data(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      try {
        await handleSubscriptionUpsert(context.db, subscription);
      } catch (error) {
        console.error("Error upserting subscription:", error);
        return data({ error: "Error upserting subscription" }, { status: 500 });
      }
      break;
    }

    case "customer.deleted": {
      const customer = event.data.object as Stripe.Customer;

      try {
        // Find user by stripeId first
        const user = await context.db.query.users.findFirst({
          where: eq(users.stripeId, customer.id),
        });

        if (user) {
          // Use batch to delete subscriptions and update user
          await context.db.batch([
            context.db
              .delete(subscriptions)
              .where(eq(subscriptions.userId, user.id)),
            context.db
              .update(users)
              .set({ stripeId: null })
              .where(eq(users.id, user.id)),
          ]);
        } else {
          console.warn(`No user found for customer deletion: ${customer.id}`);
        }
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
}

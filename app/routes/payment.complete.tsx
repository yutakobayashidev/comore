import { getCurrentSession } from "~/lib/auth/session";
import type { Route } from "./+types/payment.complete";
import { getSearchParams } from "~/utils/urls";
import { createStripeClient } from "~/lib/stripe";
import { data, redirect } from "react-router";
import { eq } from "drizzle-orm";
import { users, subscriptions } from "~/database/schema";
import { uuidv7 } from "uuidv7";

export async function loader({ context, request }: Route.LoaderArgs) {
  const { session_id: sessionId } = getSearchParams(request.url);

  if (!sessionId) {
    return data({ error: "Invalid session_id" }, { status: 400 });
  }

  const { session, user } = await getCurrentSession(context.db)(request);

  if (!session || !user) {
    return data({ error: "login required" }, { status: 400 });
  }

  const stripe = createStripeClient({
    STRIPE_SECRET_KEY: context.cloudflare.env.STRIPE_SECRET_KEY,
  });

  const paymentInfo = await stripe.checkout.sessions.retrieve(sessionId);

  if (paymentInfo.status === "complete") {
    try {
      const now = new Date();
      await context.db.batch([
        context.db
          .update(users)
          .set({
            stripeId: `${paymentInfo.customer}`,
          })
          .where(eq(users.id, user.id)),
        context.db.insert(subscriptions).values({
          id: uuidv7(),
          subscriptionId: `${paymentInfo.subscription}`,
          status: `${paymentInfo.status}`,
          cancelAtPeriodEnd: false,
          userId: user.id,
          createdAt: now,
          updatedAt: now,
        }),
      ]);
    } catch (e) {
      console.log(e);

      // session is expired
      return redirect("/me/payment?status=incomplete");
    }

    return redirect("/me/payment");
  }

  return redirect("/me/payment?status=incomplete");
}

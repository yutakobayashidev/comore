import { redirect, useLoaderData, Form, data } from "react-router";
import type { Route } from "./+types/me.payment";
import { getCurrentSession } from "~/lib/auth/session";
import { subscriptions, users } from "~/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { format } from "~/utils/date";
import { createStripeClient } from "~/lib/stripe";

export async function loader({ context, request }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const subscription = await context.db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        inArray(subscriptions.status, ["active", "complete"]),
      ),
    )
    .limit(1);

  const subscriptionData = subscription[0];

  if (!subscriptionData) {
    return {
      subscription: null,
    };
  }

  return {
    subscription: {
      subscriptionId: subscriptionData.subscriptionId,
      status: subscriptionData.status,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
    },
  };
}

export async function action({ context, request }: Route.ActionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const userWithStripeId = await context.db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { stripeId: true },
  });

  if (!userWithStripeId?.stripeId) {
    return redirect("/payment/checkout");
  }

  const env = context.cloudflare.env;
  const stripe = createStripeClient({
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  });

  const domain = new URL(request.url).origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: userWithStripeId.stripeId,
      return_url: `${domain}/me/payment`,
    });

    return redirect(session.url);
  } catch (error) {
    console.error("Failed to create billing portal session:", error);
    return data(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}

export default function PaymentPage() {
  const { subscription } = useLoaderData<typeof loader>();

  const limitDate = subscription?.cancelAtPeriodEnd
    ? subscription?.currentPeriodEnd
    : null;

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <h1 className="font-semibold text-lg">Subscription Status</h1>
      {!subscription ? (
        <p className="text-red-300">subscription not found</p>
      ) : (
        <PaymentButton
          hasSubscription={!!subscription}
          cancelAtPeriodEnd={!!subscription?.cancelAtPeriodEnd}
        />
      )}
      {limitDate && (
        <p className="text-sm text-gray-400">
          Available until {format(limitDate)}
        </p>
      )}
    </div>
  );
}

export function PaymentButton({
  hasSubscription,
  cancelAtPeriodEnd,
}: {
  hasSubscription: boolean;
  cancelAtPeriodEnd: boolean;
}) {
  if (!hasSubscription) {
    return (
      <Button asChild>
        <a href="/payment/checkout">Checkout</a>
        {String(cancelAtPeriodEnd)}
      </Button>
    );
  }

  return (
    <Form method="post">
      <Button type="submit">Manage Subscription</Button>
    </Form>
  );
}

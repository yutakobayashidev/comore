import { useMemo } from "react";
import { redirect, useLoaderData } from "react-router";
import { getStripe } from "~/lib/stripe-client";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { createStripeClient } from "~/lib/stripe";
import type { Route } from "./+types/payment.checkout";
import { getCurrentSession } from "~/lib/auth/session";
import { users } from "~/database/schema";
import { eq } from "drizzle-orm";

export async function loader({ context, request }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const stripe = createStripeClient({
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  });

  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const domain = new URL(request.url).origin;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.handle,
  });

  const { data: openSessionList } = await stripe.checkout.sessions.list({
    customer: customer.id,
    status: "open",
  });

  await Promise.all(
    openSessionList.map((openSessionItem) =>
      stripe.checkout.sessions.expire(openSessionItem.id),
    ),
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    automatic_tax: {
      enabled: true,
    },
    customer: customer.id,
    allow_promotion_codes: true,
    customer_update: {
      address: "auto",
    },
    ui_mode: "embedded",
    return_url: `${domain}/payment/complete?session_id={CHECKOUT_SESSION_ID}`,
  });

  await context.db
    .update(users)
    .set({ stripeId: customer.id })
    .where(eq(users.id, user.id));

  return {
    clientSecret: checkoutSession.client_secret,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
  };
}

export default function CheckoutPage() {
  const { publishableKey, clientSecret } = useLoaderData<typeof loader>();

  const stripePromise = useMemo(
    () => getStripe(publishableKey),
    [publishableKey],
  );

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

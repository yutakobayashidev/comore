import Stripe from "stripe";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import schema from "~/database/schema";
import { uuidv7 } from "uuidv7";
import { eq } from "drizzle-orm";
import { users, subscriptions, teamMembers } from "~/database/schema";
import { updateTeamSubscriptionStatus } from "~/lib/teams";

export function createStripeClient(env: { STRIPE_SECRET_KEY: string }) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function handleSubscriptionUpsert(
  db: DrizzleD1Database<typeof schema>,
  subscription: Stripe.Subscription,
) {
  // Find user by stripeId
  const user = await db.query.users.findFirst({
    where: eq(users.stripeId, `${subscription.customer}`),
  });

  if (!user) {
    console.warn(`No user found for subscription ${subscription.id}`);
    return;
  }

  // Support only one subscription for now
  const item = subscription.items.data[0];
  if (!item) {
    console.warn(
      `No subscription items found for subscription ${subscription.id}`,
    );
    return;
  }
  const currentPeriodEnd = new Date(item.current_period_end * 1000);
  const { id, status, cancel_at_period_end } = subscription;

  // Check if subscription exists
  const existingSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.subscriptionId, id),
  });

  let result;

  if (existingSubscription) {
    // Update existing subscription
    const batchResult = await db.batch([
      db
        .update(subscriptions)
        .set({
          status,
          currentPeriodEnd,
          cancelAtPeriodEnd: cancel_at_period_end,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.subscriptionId, id))
        .returning(),
    ]);
    result = batchResult[0]?.[0];
  } else {
    // Create new subscription
    const batchResult = await db.batch([
      db
        .insert(subscriptions)
        .values({
          id: uuidv7(),
          userId: user.id,
          subscriptionId: id,
          status,
          currentPeriodEnd,
          cancelAtPeriodEnd: cancel_at_period_end,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning(),
    ]);
    result = batchResult[0]?.[0];
  }

  // Update team subscription status for all teams where this user is an admin
  const userTeams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id));

  for (const { teamId } of userTeams) {
    await updateTeamSubscriptionStatus(db)(teamId);
  }

  return result;
}

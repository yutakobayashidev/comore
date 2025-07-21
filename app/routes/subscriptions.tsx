import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { data, redirect } from "react-router";
import { getCurrentSession } from "~/lib/sessions";
import { getUserSubscriptions } from "~/lib/subscriptions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const subscriptions = await getUserSubscriptions(context.db)(user.id);

  return data(subscriptions);
}

export default function SubscriptionsPage() {
  const { userSubscriptions, teamSubscriptions } =
    useLoaderData<typeof loader>();

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscriptions to users and teams.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">User Subscriptions</h2>
            {userSubscriptions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    You haven't subscribed to any users yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userSubscriptions.map((subscription) => (
                  <Card key={subscription.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            @{subscription.targetUser.handle}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Subscribed since{" "}
                            {new Date(
                              subscription.createdAt,
                            ).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/users/${subscription.targetUserId}`}>
                            View Profile
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Team Subscriptions</h2>
            {teamSubscriptions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    You haven't subscribed to any teams yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {teamSubscriptions.map((subscription) => (
                  <Card key={subscription.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {subscription.targetTeam.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Subscribed since{" "}
                            {new Date(
                              subscription.createdAt,
                            ).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/teams/${subscription.targetTeam.slug}`}>
                            View Team
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { redirect, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/teams";
import { getCurrentSession } from "~/lib/auth/session";
import { getUserTeams, canUserCreateTeam } from "~/lib/teams";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { format } from "~/utils/date";

export async function loader({ context, request }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const teams = await getUserTeams(context.db)(user.id);
  const canCreateTeam = await canUserCreateTeam(context.db)(user.id);

  return {
    teams,
    canCreateTeam,
  };
}

export default function TeamsPage() {
  const { teams, canCreateTeam } = useLoaderData<typeof loader>();

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-2xl">My Teams</h1>
        {canCreateTeam && (
          <Button asChild>
            <Link to="/teams/new">Create Team</Link>
          </Button>
        )}
      </div>

      {!canCreateTeam && (
        <Card className="border-yellow-600 bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="text-yellow-600">
              Subscription Required
            </CardTitle>
            <CardDescription>
              You need an active subscription to create teams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/payment/checkout">Subscribe Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No teams yet</CardTitle>
            <CardDescription>
              {canCreateTeam
                ? "Create your first team to start collaborating."
                : "Join a team or subscribe to create your own."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {teams.map(({ team, role, joinedAt }) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      <Link
                        to={`/teams/${team.slug}`}
                        className="hover:underline"
                      >
                        {team.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>Joined {format(joinedAt)}</CardDescription>
                  </div>
                  <Badge variant={role === "admin" ? "default" : "secondary"}>
                    {role}
                  </Badge>
                </div>
              </CardHeader>
              {!team.hasActiveSubscription && (
                <CardContent>
                  <p className="text-sm text-yellow-600">
                    No active subscription - Limited functionality
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

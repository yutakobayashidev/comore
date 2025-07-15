import { redirect, useLoaderData, Form, data } from "react-router";
import type { Route } from "./+types/teams.$slug.settings";
import { getCurrentSession } from "~/lib/auth/session";
import {
  getTeamBySlug,
  getTeamMembers,
  isUserTeamAdmin,
  getActiveAdminCount,
  deleteTeam,
  transferTeamOwnership,
  canUserCreateTeam,
} from "~/lib/teams";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export async function loader({ context, request, params }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const team = await getTeamBySlug(context.db, params.slug);

  if (!team) {
    throw new Response("Team not found", { status: 404 });
  }

  const isAdmin = await isUserTeamAdmin(context.db, user.id, team.id);

  if (!isAdmin) {
    return redirect(`/teams/${team.slug}`);
  }

  const members = await getTeamMembers(context.db, team.id);
  const activeAdminCount = await getActiveAdminCount(context.db, team.id);

  const eligibleTransferTargets = [];
  for (const { member, user: memberUser } of members) {
    if (member.userId !== user.id) {
      const canCreate = await canUserCreateTeam(context.db, member.userId);
      if (canCreate) {
        eligibleTransferTargets.push({ member, user: memberUser });
      }
    }
  }

  return {
    team,
    currentUserId: user.id,
    activeAdminCount,
    eligibleTransferTargets,
    isLastActiveAdmin: activeAdminCount === 1 && isAdmin,
  };
}

export async function action({ context, request, params }: Route.ActionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const team = await getTeamBySlug(context.db, params.slug);

  if (!team) {
    throw new Response("Team not found", { status: 404 });
  }

  const isAdmin = await isUserTeamAdmin(context.db, user.id, team.id);

  if (!isAdmin) {
    return data(
      { error: "Only team admins can perform this action" },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  switch (intent) {
    case "delete": {
      try {
        await deleteTeam(context.db, team.id);
        return redirect("/teams");
      } catch (error) {
        console.error("Failed to delete team:", error);
        return data({ error: "Failed to delete team" }, { status: 500 });
      }
    }

    case "transfer": {
      const targetUserId = formData.get("targetUserId") as string;

      if (!targetUserId) {
        return data({ error: "Target user is required" }, { status: 400 });
      }

      try {
        await transferTeamOwnership(context.db, {
          teamId: team.id,
          fromUserId: user.id,
          toUserId: parseInt(targetUserId),
        });

        return redirect(`/teams/${team.slug}`);
      } catch (error) {
        console.error("Failed to transfer team:", error);
        return data(
          { error: "Failed to transfer team ownership" },
          { status: 500 },
        );
      }
    }

    default:
      return data({ error: "Invalid action" }, { status: 400 });
  }
}

export default function TeamSettingsPage() {
  const { team, eligibleTransferTargets, isLastActiveAdmin } =
    useLoaderData<typeof loader>();

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Team Settings</h1>
        <p className="text-muted-foreground">{team.name}</p>
      </div>

      {isLastActiveAdmin && (
        <Alert className="border-yellow-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You are the last admin with an active subscription. You must either
            delete the team or transfer ownership to another member with a
            subscription before leaving.
          </AlertDescription>
        </Alert>
      )}

      {eligibleTransferTargets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Ownership</CardTitle>
            <CardDescription>
              Transfer admin rights to another team member with an active
              subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="transfer" />

              <Select name="targetUserId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleTransferTargets.map(({ member, user }) => (
                    <SelectItem key={member.id} value={user.id.toString()}>
                      {user.handle} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit">Transfer Ownership</Button>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-600">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Once you delete a team, there is no going back. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            method="post"
            onSubmit={(e) => {
              if (
                !confirm(
                  "Are you sure you want to delete this team? This action cannot be undone.",
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="intent" value="delete" />
            <Button type="submit" variant="destructive">
              Delete Team
            </Button>
          </Form>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" asChild>
          <a href={`/teams/${team.slug}`}>Back to Team</a>
        </Button>
      </div>
    </div>
  );
}

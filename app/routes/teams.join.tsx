import { redirect, useLoaderData, Form } from "react-router";
import type { Route } from "./+types/teams.join";
import { getCurrentSession } from "~/lib/auth/session";
import { acceptTeamInvitation, getTeamById } from "~/lib/teams";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export async function loader({ context, request }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/teams");
  }

  return { token };
}

export async function action({ context, request }: Route.ActionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const formData = await request.formData();
  const token = formData.get("token") as string;

  if (!token) {
    return redirect("/teams");
  }

  try {
    const invitation = await acceptTeamInvitation(context.db)({
      token,
      userId: user.id,
    });

    const team = await getTeamById(context.db)(invitation.teamId);

    if (team) {
      return redirect(`/teams/${team.slug}`);
    }

    return redirect("/teams");
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return redirect("/teams");
  }
}

export default function JoinTeamPage() {
  const { token } = useLoaderData<typeof loader>();

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Join Team</CardTitle>
          <CardDescription>
            You've been invited to join a team. Click below to accept the
            invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div className="flex gap-4">
              <Button type="submit">Accept Invitation</Button>
              <Button type="button" variant="outline" asChild>
                <a href="/teams">Cancel</a>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

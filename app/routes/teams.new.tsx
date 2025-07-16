import { redirect, useActionData, Form, data, useNavigation } from "react-router";
import type { Route } from "./+types/teams.new";
import { z } from "zod";
import { getCurrentSession } from "~/lib/auth/session";
import { createTeam, hasActiveSubscription, getTeamBySlug } from "~/lib/teams";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const TeamSchema = z.object({
  name: z.string().min(1, { message: "チーム名は必須です。" }),
  slug: z
    .string()
    .min(1, { message: "URLスラッグは必須です。" })
    .regex(/^[a-z0-9-]+$/, {
      message: "URLスラッグは小文字、数字、ハイフンのみ使用できます。",
    }),
});

export async function loader({ context, request }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const canCreate = await hasActiveSubscription(context.db)(user.id);

  if (!canCreate) {
    return redirect("/teams");
  }

  return {};
}

export async function action({ context, request }: Route.ActionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const canCreate = await hasActiveSubscription(context.db)(user.id);

  if (!canCreate) {
    return data(
      { error: "You need an active subscription to create teams" },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  if (!name || !slug) {
    return data({ error: "Team name and slug are required" }, { status: 400 });
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return data(
      {
        error: "Slug can only contain lowercase letters, numbers, and hyphens",
      },
      { status: 400 },
    );
  }

  const existingTeam = await getTeamBySlug(context.db)(slug);
  if (existingTeam) {
    return data(
      { error: "A team with this slug already exists" },
      { status: 400 },
    );
  }

  try {
    const team = await createTeam(context.db)({
      name,
      slug,
      creatorUserId: user.id,
    });

    return redirect(`/teams/${team.slug}`);
  } catch (error) {
    console.error("Failed to create team:", error);
    return data({ error: "Failed to create team" }, { status: 500 });
  }
}

export default function NewTeamPage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Team</CardTitle>
          <CardDescription>
            Teams allow you to collaborate with others. As a team admin, you can
            invite members and manage access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="My Awesome Team"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Team Slug</Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                required
                pattern="[a-z0-9-]+"
                placeholder="my-awesome-team"
              />
              <p className="text-sm text-muted-foreground">
                This will be used in your team's URL. Use lowercase letters,
                numbers, and hyphens only.
              </p>
            </div>

            {actionData?.error && (
              <p className="text-sm text-red-600">{actionData.error}</p>
            )}

            <div className="flex gap-4">
              <Button type="submit">Create Team</Button>
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

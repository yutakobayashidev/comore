import {
  redirect,
  useActionData,
  Form,
  data,
  useNavigation,
} from "react-router";
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

  const formDataObject = Object.fromEntries(await request.formData());
  const validationResult = TeamSchema.safeParse(formDataObject);

  if (!validationResult.success) {
    return data({
      validationMessages: validationResult.error.flatten().fieldErrors,
    });
  }

  const { name, slug } = validationResult.data;

  const existingTeam = await getTeamBySlug(context.db)(slug);
  if (existingTeam) {
    return data({
      validationMessages: {
        slug: ["このURLスラッグは既に使用されています。"],
      },
    });
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
  const validationMessages = actionData && 'validationMessages' in actionData
    ? actionData.validationMessages
    : undefined;
  const error = actionData && 'error' in actionData ? actionData.error : undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

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
                placeholder="My Awesome Team"
              />
              {validationMessages?.name && (
                <p className="text-sm text-red-600">
                  {validationMessages.name[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Team Slug</Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="my-awesome-team"
              />
              <p className="text-sm text-muted-foreground">
                This will be used in your team's URL. Use lowercase letters,
                numbers, and hyphens only.
              </p>
              {validationMessages?.slug && (
                <p className="text-sm text-red-600">
                  {validationMessages.slug[0]}
                </p>
              )}
            </div>

            {actionData?.error && (
              <p className="text-sm text-red-600">{actionData.error}</p>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "作成中..." : "Create Team"}
              </Button>
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

import {
  redirect,
  useLoaderData,
  Form,
  data,
  useActionData,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/me.settings";
import { z } from "zod";
import { getCurrentSession } from "~/lib/auth/session";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getUserById, updateUserSocialLinks } from "~/lib/users";

const SocialLinksSchema = z.object({
  websiteUrl: z
    .string()
    .optional()
    .transform((val) => val?.trim() || "")
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      {
        message: "Please enter a valid URL",
      },
    ),
  twitterUsername: z
    .string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z0-9_]*$/.test(val), {
      message: "Username can only contain letters, numbers, and underscores",
    }),
  blueskyAddress: z
    .string()
    .optional()
    .refine((val) => !val || /^(@[a-zA-Z0-9.-]+)?$/.test(val), {
      message:
        "Please enter a valid Bluesky address (e.g., @username.bsky.social)",
    }),
  activityPubAddress: z
    .string()
    .optional()
    .refine((val) => !val || /^(@[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+)?$/.test(val), {
      message:
        "Please enter a valid ActivityPub address (e.g., @username@mastodon.social)",
    }),
});

export async function loader({ context, request }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const fullUser = await getUserById(context.db)(user.id);

  return {
    user: fullUser,
  };
}

export async function action({ context, request }: Route.ActionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const formDataObject = Object.fromEntries(await request.formData());
  const validationResult = SocialLinksSchema.safeParse(formDataObject);

  if (!validationResult.success) {
    return data({
      validationMessages: validationResult.error.flatten().fieldErrors,
    });
  }

  const { websiteUrl, twitterUsername, blueskyAddress, activityPubAddress } =
    validationResult.data;

  try {
    await updateUserSocialLinks(context.db)({
      userId: user.id,
      websiteUrl: websiteUrl || null,
      twitterUsername: twitterUsername || null,
      blueskyAddress: blueskyAddress || null,
      activityPubAddress: activityPubAddress || null,
    });

    return redirect("/me/settings?success=true");
  } catch (error) {
    console.error("Failed to update social links:", error);
    return data({ error: "Failed to update social links" }, { status: 500 });
  }
}

export default function UserSettingsPage() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const validationMessages =
    actionData && "validationMessages" in actionData
      ? actionData.validationMessages
      : undefined;
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and social links
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Add your social media profiles and website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://example.com"
                defaultValue={user?.websiteUrl || ""}
              />
              {validationMessages?.websiteUrl && (
                <p className="text-sm text-red-600">
                  {validationMessages.websiteUrl[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterUsername">Twitter Username</Label>
              <Input
                id="twitterUsername"
                name="twitterUsername"
                placeholder="username"
                defaultValue={user?.twitterUsername || ""}
              />
              <p className="text-sm text-muted-foreground">
                Enter your username without the @ symbol
              </p>
              {validationMessages?.twitterUsername && (
                <p className="text-sm text-red-600">
                  {validationMessages.twitterUsername[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="blueskyAddress">Bluesky</Label>
              <Input
                id="blueskyAddress"
                name="blueskyAddress"
                placeholder="@username.bsky.social"
                defaultValue={user?.blueskyAddress || ""}
              />
              {validationMessages?.blueskyAddress && (
                <p className="text-sm text-red-600">
                  {validationMessages.blueskyAddress[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityPubAddress">ActivityPub</Label>
              <Input
                id="activityPubAddress"
                name="activityPubAddress"
                placeholder="@username@mastodon.social"
                defaultValue={user?.activityPubAddress || ""}
              />
              <p className="text-sm text-muted-foreground">
                Your Mastodon or other ActivityPub address
              </p>
              {validationMessages?.activityPubAddress && (
                <p className="text-sm text-red-600">
                  {validationMessages.activityPubAddress[0]}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </Form>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" asChild>
          <a href="/me/payment">Back to Dashboard</a>
        </Button>
      </div>
    </div>
  );
}

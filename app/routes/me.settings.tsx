import { redirect, useLoaderData, Form, data } from "react-router";
import type { Route } from "./+types/me.settings";
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

  const formData = await request.formData();
  const websiteUrl = formData.get("websiteUrl") as string;
  const twitterUsername = formData.get("twitterUsername") as string;
  const blueskyAddress = formData.get("blueskyAddress") as string;
  const activityPubAddress = formData.get("activityPubAddress") as string;

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

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and social links</p>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="blueskyAddress">Bluesky</Label>
              <Input
                id="blueskyAddress"
                name="blueskyAddress"
                placeholder="@username.bsky.social"
                defaultValue={user?.blueskyAddress || ""}
              />
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
            </div>

            <Button type="submit">Save Changes</Button>
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
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
} from "react-router";
import { data, redirect } from "react-router";
import { getCurrentSession } from "~/lib/auth/session";
import { getFeedById, updateFeed, deleteFeed } from "~/lib/feeds";
import { updateFeedSchema } from "~/schemas/feed";
import type { FeedError } from "~/lib/feeds/interface";
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
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Checkbox } from "~/components/ui/checkbox";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const feedId = Number(params["id"]);
  if (isNaN(feedId)) {
    throw new Response("Not Found", { status: 404 });
  }

  const feed = await getFeedById(context.db)(feedId);

  if (!feed || feed.userId !== user.id) {
    throw new Response("Not Found", { status: 404 });
  }

  return data({ feed });
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const feedId = Number(params["id"]);
  if (isNaN(feedId)) {
    throw new Response("Not Found", { status: 404 });
  }

  const formDataObject = Object.fromEntries(await request.formData());
  const actionType = formDataObject["_action"];

  if (actionType === "delete") {
    try {
      await deleteFeed(context.db)(feedId, user.id);
      return redirect("/feeds");
    } catch (error) {
      console.error("Failed to delete feed:", error);
      return data({ error: "Failed to delete feed" }, { status: 500 });
    }
  }

  // Update action
  const validationResult = updateFeedSchema.safeParse(formDataObject);

  if (!validationResult.success) {
    return data({
      validationMessages: validationResult.error.flatten().fieldErrors,
    });
  }

  const { title, url, isActive } = validationResult.data;

  try {
    await updateFeed(context.db)({
      id: feedId,
      userId: user.id,
      title,
      url,
      isActive,
    });

    return redirect("/feeds");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const feedError = error as FeedError;
      if (feedError.code === "FEED_ALREADY_EXISTS") {
        return data({
          validationMessages: {
            url: ["This feed URL is already registered"],
          },
        });
      }
    }

    console.error("Failed to update feed:", error);
    return data({ error: "Failed to update feed" }, { status: 500 });
  }
}

export default function EditFeedPage() {
  const { feed } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  const validationMessages =
    actionData && "validationMessages" in actionData
      ? actionData.validationMessages
      : undefined;
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;

  return (
    <div className="container max-w-2xl py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Edit Feed</h1>
          <p className="text-muted-foreground mt-2">
            Update your RSS feed settings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feed Settings</CardTitle>
            <CardDescription>
              Modify the feed URL, title, or active status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={feed.title}
                  required
                />
                {validationMessages?.title && (
                  <p className="text-sm text-red-600">
                    {validationMessages.title[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Feed URL</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  defaultValue={feed.url}
                  required
                />
                {validationMessages?.url && (
                  <p className="text-sm text-red-600">
                    {validationMessages.url[0]}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  name="isActive"
                  defaultChecked={feed.isActive}
                />
                <Label
                  htmlFor="isActive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Active (enable automatic fetching)
                </Label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  name="_action"
                  value="update"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="submit"
                  name="_action"
                  value="delete"
                  variant="destructive"
                  disabled={submitting}
                  onClick={(e) => {
                    if (
                      !confirm(
                        "Are you sure you want to delete this feed? This will also delete all associated articles.",
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  {submitting ? "Deleting..." : "Delete Feed"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href="/feeds">Cancel</a>
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        {feed.lastErrorAt && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Last Error:</strong> {feed.lastErrorMessage}
              <br />
              <span className="text-sm">
                Occurred at: {new Date(feed.lastErrorAt).toLocaleString()}
              </span>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

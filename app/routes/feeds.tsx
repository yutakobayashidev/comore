import { data, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { getCurrentSession } from "~/lib/sessions";
import { createFeed, getUserFeeds, getFeedCount } from "~/lib/feeds";
import { hasActiveSubscription } from "~/lib/teams";
import { feedSchema } from "~/schemas/feed";
import type { FeedError } from "~/lib/feeds/interface";
import { Rss, Edit, AlertCircle } from "lucide-react";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const [feeds, hasSubscription, feedCount] = await Promise.all([
    getUserFeeds(context.db)(user.id),
    hasActiveSubscription(context.db)(user.id),
    getFeedCount(context.db)(user.id),
  ]);

  const feedLimit = hasSubscription ? 50 : 5;

  return data({
    feeds,
    hasActiveSubscription: hasSubscription,
    feedCount,
    feedLimit,
  });
}

export async function action({ context, request }: ActionFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const formDataObject = Object.fromEntries(await request.formData());
  const validationResult = feedSchema.safeParse(formDataObject);

  if (!validationResult.success) {
    return data({
      validationMessages: validationResult.error.flatten().fieldErrors,
    });
  }

  const { url, title, description } = validationResult.data;

  try {
    await createFeed(context.db)({
      userId: user.id,
      url,
      title,
      description,
    });
    return redirect("/feeds");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const feedError = error as FeedError;
      switch (feedError.code) {
        case "FEED_LIMIT_EXCEEDED":
          return data({ error: feedError.message });
        case "FEED_ALREADY_EXISTS":
          return data({
            validationMessages: {
              url: ["This feed URL already exists in your collection"],
            },
          });
        case "INVALID_FEED_URL":
          return data({
            validationMessages: {
              url: ["Please enter a valid feed URL"],
            },
          });
        default:
          return data({ error: "Failed to add feed" });
      }
    }
    console.error("Failed to create feed:", error);
    return data({ error: "Failed to add feed" }, { status: 500 });
  }
}

export default function FeedsPage() {
  const { feeds, hasActiveSubscription, feedCount, feedLimit } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  const validationMessages =
    actionData && "validationMessages" in actionData
      ? actionData.validationMessages
      : undefined;
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;

  const canAddMoreFeeds = feedCount < feedLimit;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">RSS Feeds</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your RSS feed collection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Feed</CardTitle>
            <CardDescription>
              Add a new RSS or Atom feed to your collection.
              {!hasActiveSubscription && (
                <span className="mt-1 block text-sm">
                  Free users can add up to {feedLimit} feeds. You have{" "}
                  {feedCount} of {feedLimit} feeds.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!canAddMoreFeeds ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've reached the limit of {feedLimit} feeds.
                  {!hasActiveSubscription && (
                    <span> Upgrade to a paid plan to add up to 50 feeds.</span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Form method="post" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Feed URL</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://example.com/feed.xml"
                    required
                  />
                  {validationMessages?.url && (
                    <p className="text-sm text-red-600">
                      {validationMessages.url[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="My Favorite Blog"
                  />
                  {validationMessages?.title && (
                    <p className="text-sm text-red-600">
                      {validationMessages.title[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="A brief description of this feed"
                  />
                  {validationMessages?.description && (
                    <p className="text-sm text-red-600">
                      {validationMessages.description[0]}
                    </p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Feed"}
                </Button>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Feeds</h2>
          {feeds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Rss className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  You haven't added any feeds yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {feeds.map((feed) => (
                <Card key={feed.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{feed.title}</h3>
                        {!feed.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feed.url}
                      </p>
                      {feed.description && (
                        <p className="text-sm text-muted-foreground">
                          {feed.description}
                        </p>
                      )}
                      {feed.lastErrorAt && (
                        <p className="text-sm text-red-600">
                          Last error: {feed.lastErrorMessage}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/feeds/${feed.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

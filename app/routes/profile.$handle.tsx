import {
  useLoaderData,
  useActionData,
  Form,
  useNavigation,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import { users } from "../../database/schema";
import { eq } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Link2, AtSign } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import type { Route } from "./+types/profile.$handle";
import { getArticlesByUserId } from "@/lib/articles";
import {
  subscribeToUser,
  unsubscribeFromUser,
  isSubscribedToUser,
} from "@/lib/subscriptions";
import { getCurrentSession } from "@/lib/sessions";
import { redirect } from "react-router";
import type { loader as layoutLoader } from "./layout";
import { ArticleList } from "@/components/articles/article-list";
import { SubscribeButton } from "@/components/subscriptions/subscribe-button";

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const handle = params.handle;

  if (!handle) {
    throw new Response("Not Found", { status: 404 });
  }

  const targetUser = await context.db
    .select()
    .from(users)
    .where(eq(users.handle, handle))
    .get();

  if (!targetUser) {
    throw new Response("User not found", { status: 404 });
  }

  // Get articles
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 20;

  const articlesResponse = await getArticlesByUserId(context.db)(
    targetUser.id,
    {
      page,
      limit,
    },
  );

  // Check subscription status if logged in
  const { user } = await getCurrentSession(context.db)(request);
  let isSubscribed = false;

  if (user && user.id !== targetUser.id) {
    isSubscribed = await isSubscribedToUser(context.db)(user.id, targetUser.id);
  }

  return {
    user: targetUser,
    ...articlesResponse,
    isSubscribed,
    isOwnProfile: user?.id === targetUser.id,
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const handle = params.handle;
  if (!handle) {
    throw new Response("Not Found", { status: 404 });
  }

  const targetUser = await context.db
    .select()
    .from(users)
    .where(eq(users.handle, handle))
    .get();

  if (!targetUser) {
    throw new Response("User not found", { status: 404 });
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    if (action === "subscribe") {
      await subscribeToUser(context.db)(user.id, targetUser.id);
    } else if (action === "unsubscribe") {
      await unsubscribeFromUser(context.db)(user.id, targetUser.id);
    }
  } catch (error) {
    console.error("Subscription action failed:", error);
  }

  return redirect(`/${handle}`);
}

export function meta({ data }: { data: { user: { handle: string } } }) {
  return [
    { title: `@${data.user.handle} - Comore` },
    {
      name: "description",
      content: `View @${data.user.handle}'s profile on Comore`,
    },
  ];
}

export default function ProfilePage() {
  const { user, articles, hasMore, isSubscribed, isOwnProfile } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/layout");
  const isAuthenticated = layoutData?.isAuthenticated ?? false;
  
  const currentPage = Number(searchParams.get("page") || "1");
  const isLoading = navigation.state === "loading";

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setSearchParams({ page: nextPage.toString() });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {user.handle.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">@{user.handle}</CardTitle>
              </div>
            </div>
            {isAuthenticated && !isOwnProfile && (
              <SubscribeButton
                isSubscribed={isSubscribed}
                targetType="user"
                targetId={user.id}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GitHub ID</p>
                <p className="font-medium">{user.githubId}</p>
              </div>
            </div>

            {(user.websiteUrl ||
              user.twitterUsername ||
              user.blueskyAddress ||
              user.activityPubAddress) && (
              <div className="border-t pt-4 space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Social Links
                </p>
                <div className="flex flex-wrap gap-3">
                  {user.websiteUrl && (
                    <a
                      href={user.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm hover:underline"
                    >
                      <Link2 className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {user.twitterUsername && (
                    <a
                      href={`https://twitter.com/${user.twitterUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm hover:underline"
                    >
                      @{user.twitterUsername}
                    </a>
                  )}
                  {user.blueskyAddress && (
                    <a
                      href={`https://bsky.app/profile/${user.blueskyAddress.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm hover:underline"
                    >
                      <AtSign className="h-4 w-4" />
                      {user.blueskyAddress}
                    </a>
                  )}
                  {user.activityPubAddress && (
                    <span className="flex items-center gap-1 text-sm">
                      <AtSign className="h-4 w-4" />
                      {user.activityPubAddress}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Articles</h2>
        <ArticleList
          articles={articles}
          hasMore={hasMore && !isLoading}
          loadMore={handleLoadMore}
          emptyMessage="This user hasn't published any articles yet."
        />
      </div>
    </div>
  );
}

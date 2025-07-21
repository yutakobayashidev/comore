import {
  redirect,
  useLoaderData,
  useActionData,
  Link,
  Form,
  data,
  useSearchParams,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/teams.$slug";
import { getCurrentSession } from "~/lib/auth/session";
import {
  getTeamBySlug,
  getTeamMembers,
  isUserTeamAdmin,
  createTeamInvitation,
  removeTeamMember,
  getActiveAdminCount,
} from "~/lib/teams";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, Copy } from "lucide-react";
import { getArticlesByTeamId } from "~/lib/articles";
import {
  isSubscribedToTeam,
  subscribeToTeam,
  unsubscribeFromTeam,
} from "~/lib/subscriptions";
import { ArticleList } from "~/components/articles/article-list";
import { SubscribeButton } from "~/components/subscriptions/subscribe-button";

export async function loader({ context, request, params }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const team = await getTeamBySlug(context.db)(params.slug);

  if (!team) {
    throw new Response("Team not found", { status: 404 });
  }

  const members = await getTeamMembers(context.db)(team.id);
  const isAdmin = await isUserTeamAdmin(context.db)(user.id, team.id);
  const isMember = members.some((m) => m.member.userId === user.id);

  // Get articles for public team pages
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const limit = 20;

  const articlesData = await getArticlesByTeamId(context.db)(team.id, {
    page,
    limit,
  });
  const isSubscribed = await isSubscribedToTeam(context.db)(user.id, team.id);

  return {
    team,
    members,
    isAdmin,
    currentUserId: user.id,
    isMember,
    articles: articlesData.articles,
    hasMore: articlesData.hasMore,
    totalCount: articlesData.totalCount,
    isSubscribed,
    currentPage: page,
  };
}

export async function action({ context, request, params }: Route.ActionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const team = await getTeamBySlug(context.db)(params.slug);

  if (!team) {
    throw new Response("Team not found", { status: 404 });
  }

  const isAdmin = await isUserTeamAdmin(context.db)(user.id, team.id);

  if (!isAdmin) {
    return data(
      { error: "Only team admins can perform this action" },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  switch (intent) {
    case "subscribe": {
      try {
        await subscribeToTeam(context.db)(user.id, team.id);
        return redirect(`/teams/${team.slug}`);
      } catch (error) {
        console.error("Failed to subscribe:", error);
        return data({ error: "Failed to subscribe" }, { status: 500 });
      }
    }

    case "unsubscribe": {
      try {
        await unsubscribeFromTeam(context.db)(user.id, team.id);
        return redirect(`/teams/${team.slug}`);
      } catch (error) {
        console.error("Failed to unsubscribe:", error);
        return data({ error: "Failed to unsubscribe" }, { status: 500 });
      }
    }

    case "invite": {
      if (!isAdmin) {
        return data(
          { error: "Only team admins can create invitations" },
          { status: 403 },
        );
      }

      try {
        const invitation = await createTeamInvitation(context.db)({
          teamId: team.id,
          invitedByUserId: user.id,
        });

        const url = new URL(request.url);
        const inviteLink = `${url.origin}/teams/join?token=${invitation.token}`;

        return data({ inviteLink });
      } catch (error) {
        console.error("Failed to create invitation:", error);
        return data({ error: "Failed to create invitation" }, { status: 500 });
      }
    }

    case "remove-member": {
      const memberId = formData.get("memberId") as string;

      if (!memberId) {
        return data({ error: "Member ID is required" }, { status: 400 });
      }

      const memberIdNum = parseInt(memberId);

      if (memberIdNum === user.id) {
        const activeAdminCount = await getActiveAdminCount(context.db)(team.id);

        if (activeAdminCount <= 1) {
          return data(
            {
              error: "Cannot remove the last admin with an active subscription",
            },
            { status: 400 },
          );
        }
      }

      try {
        await removeTeamMember(context.db)({
          teamId: team.id,
          userId: memberIdNum,
        });

        return redirect(`/teams/${team.slug}`);
      } catch (error) {
        console.error("Failed to remove member:", error);
        return data({ error: "Failed to remove member" }, { status: 500 });
      }
    }

    default:
      return data({ error: "Invalid action" }, { status: 400 });
  }
}

export default function TeamPage() {
  const {
    team,
    members,
    isAdmin,
    currentUserId,
    isMember,
    articles,
    hasMore,
    isSubscribed,
    currentPage,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  const isLoading = navigation.state === "loading";

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setSearchParams({ page: nextPage.toString() });
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h1 className="font-semibold text-2xl">{team.name}</h1>
          <p className="text-muted-foreground">/{team.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isMember && (
            <SubscribeButton
              isSubscribed={isSubscribed}
              targetType="team"
              targetId={team.id}
            />
          )}
          {isAdmin && (
            <div className="space-x-2">
              <Form method="post" className="inline">
                <input type="hidden" name="intent" value="invite" />
                <Button type="submit" variant="outline">
                  Generate Invite Link
                </Button>
              </Form>
              <Button asChild variant="outline">
                <Link to={`/teams/${team.slug}/settings`}>Settings</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {!team.hasActiveSubscription && (
        <Card className="border-yellow-600 bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="text-yellow-600">
              Limited Functionality
            </CardTitle>
            <CardDescription>
              This team has no active subscriptions. Some features may be
              limited.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {actionData && "inviteLink" in actionData && (
        <Card>
          <CardHeader>
            <CardTitle>Invitation Link</CardTitle>
            <CardDescription>
              Share this link to invite new members. It expires in 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm">
                {actionData.inviteLink}
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(actionData.inviteLink)
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map(({ member, user }) => (
              <div
                key={member.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{user.handle}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Badge
                    variant={member.role === "admin" ? "default" : "secondary"}
                  >
                    {member.role}
                  </Badge>
                </div>
                {isAdmin && user.id !== currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="remove-member"
                        />
                        <input type="hidden" name="memberId" value={user.id} />
                        <DropdownMenuItem asChild>
                          <button type="submit" className="w-full text-left">
                            Remove from team
                          </button>
                        </DropdownMenuItem>
                      </Form>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {actionData && "error" in actionData && (
        <p className="text-sm text-red-600">{actionData.error}</p>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Articles</h2>
        <ArticleList
          articles={articles}
          hasMore={hasMore && !isLoading}
          loadMore={handleLoadMore}
          emptyMessage="No articles published by team members yet."
        />
      </div>
    </div>
  );
}

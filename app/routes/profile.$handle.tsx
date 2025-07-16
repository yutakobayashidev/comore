import { useLoaderData } from "react-router";
import { users } from "../../database/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Link2, AtSign } from "lucide-react";
import type { Route } from "./+types/profile.$handle";

export async function loader({ params, context }: Route.LoaderArgs) {
  const handle = params.handle;

  if (!handle) {
    throw new Response("Not Found", { status: 404 });
  }

  const user = await context.db
    .select()
    .from(users)
    .where(eq(users.handle, handle))
    .get();

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return { user };
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
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
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
    </div>
  );
}

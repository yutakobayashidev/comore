import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { users } from "../../database/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

export async function loader({ params, context }: LoaderFunctionArgs) {
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
  if (!data?.user) {
    return [{ title: "User not found" }];
  }
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
        </CardContent>
      </Card>
    </div>
  );
}

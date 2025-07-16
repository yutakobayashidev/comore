import { Outlet, useLoaderData, redirect } from "react-router";
import type { Route } from "./+types/layout";
import {
  getCurrentSession,
  invalidateSession,
  deleteSessionTokenCookie,
} from "~/lib/auth/session";
import { Header } from "~/components/header";

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    const { session } = await getCurrentSession(context.db)(request);

    if (session) {
      await invalidateSession(context.db)(session.id);
    }

    return redirect("/", {
      headers: {
        "Set-Cookie": deleteSessionTokenCookie(),
      },
    });
  }

  return null;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (user) {
    return {
      user,
      isAuthenticated: true as const,
    };
  }

  return {
    user: null,
    isAuthenticated: false as const,
  };
}

export default function AppLayout() {
  const { user, isAuthenticated } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen">
      <Header user={user} isAuthenticated={isAuthenticated} />
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

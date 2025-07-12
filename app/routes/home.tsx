import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  useLoaderData,
  Link,
  Form,
  redirect,
} from "react-router";
import {
  getCurrentSession,
  invalidateSession,
  deleteSessionTokenCookie,
} from "~/lib/auth/session";
import { Welcome } from "../welcome/welcome";
import { Button } from "~/components/ui/button";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function action({ request, context }: ActionFunctionArgs) {
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

export async function loader({ request, context }: LoaderFunctionArgs) {
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

export default function Home() {
  const { user, isAuthenticated } = useLoaderData<typeof loader>();

  return (
    <div>
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
        }}
      >
        {isAuthenticated ? (
          <div>
            <h3>Logged In</h3>
            <p>Username: {user.username}</p>
            <p>Email: {user.email}</p>
            <p>GitHub ID: {user.githubId}</p>
            <Form method="post" className="mt-4">
              <input type="hidden" name="intent" value="logout" />
              <Button type="submit" variant="destructive">
                Sign Out
              </Button>
            </Form>
          </div>
        ) : (
          <div>
            <h3>Not Logged In</h3>
            <p>Please login to continue</p>
            <Link to="/login/github">
              <Button variant="default" className="mt-4">
                Login with GitHub
              </Button>
            </Link>
          </div>
        )}
      </div>
      <Welcome />
    </div>
  );
}

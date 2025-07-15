import { useRouteLoaderData, Link } from "react-router";
import type { loader as layoutLoader } from "./layout";
import { Button } from "~/components/ui/button";

export function meta() {
  return [
    { title: "Comore" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const loaderData = useRouteLoaderData<typeof layoutLoader>("routes/layout");
  const user = loaderData?.user;
  const isAuthenticated = loaderData?.isAuthenticated ?? false;

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Welcome to Comore</h1>
      <p className="text-lg text-muted-foreground mb-6">
        {isAuthenticated && user
          ? `Hello, @${user.handle}! You're successfully logged in.`
          : "Please login to access your dashboard."}
      </p>
      {isAuthenticated && user && (
        <Link to={`/${user.handle}`}>
          <Button>View Your Profile</Button>
        </Link>
      )}
    </>
  );
}

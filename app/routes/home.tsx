import { useRouteLoaderData } from "react-router";
import type { loader as layoutLoader } from "./layout";

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
      <p className="text-lg text-muted-foreground">
        {isAuthenticated && user
          ? `Hello, ${user.username}! You're successfully logged in.`
          : "Please login to access your dashboard."}
      </p>
    </>
  );
}

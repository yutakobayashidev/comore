import { useRouteLoaderData, Link } from "react-router";
import type { loader as layoutLoader } from "./layout";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

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
      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Welcome to Comore
      </h1>
      <p className="text-lg text-muted-foreground mb-6">
        {isAuthenticated && user
          ? `Hello, @${user.handle}! You're successfully logged in.`
          : "Please login to access your dashboard."}
      </p>
      {isAuthenticated && user && (
        <div className="space-y-6">
          <Link to={`/${user.handle}`}>
            <Button size="lg">View Your Profile</Button>
          </Link>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Get started with your first project</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Begin your journey with our comprehensive guides and tutorials.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Learn more about our features</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Explore our detailed documentation and API references.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Community</CardTitle>
                <CardDescription>Join our growing community</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect with other developers and share your experiences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

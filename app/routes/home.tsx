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
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [
    { title: "Comore - Collaborative Platform" },
    {
      name: "description",
      content: "Connect, collaborate, and create amazing things together!",
    },
  ];
}

export default function Home() {
  const loaderData = useRouteLoaderData<typeof layoutLoader>("routes/layout");
  const user = loaderData?.user;
  const isAuthenticated = loaderData?.isAuthenticated ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="text-center space-y-4 py-8">
        <Badge className="mb-4 animate-in fade-in-0 slide-in-from-bottom-1">
          New Features Available
        </Badge>
        <h1 className="text-5xl font-bold mb-4 animate-in fade-in-0 slide-in-from-bottom-2">
          Welcome to Comore
        </h1>
        <p className="text-xl text-muted-foreground mb-6 animate-in fade-in-0 slide-in-from-bottom-3">
          {isAuthenticated && user
            ? `Hello, @${user.handle}! Let's create something amazing today.`
            : "Your collaborative workspace awaits. Join us today!"}
        </p>
        {isAuthenticated && user ? (
          <div className="flex gap-4 justify-center animate-in fade-in-0 slide-in-from-bottom-4">
            <Link to={`/${user.handle}`}>
              <Button size="lg">View Your Profile</Button>
            </Link>
            <Link to="/me/payment">
              <Button variant="outline" size="lg">
                Manage Subscription
              </Button>
            </Link>
          </div>
        ) : (
          <Link to="/login/github">
            <Button
              size="lg"
              className="animate-in fade-in-0 slide-in-from-bottom-4"
            >
              Get Started with GitHub
            </Button>
          </Link>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card className="animate-in fade-in-0 slide-in-from-bottom-5">
          <CardHeader>
            <CardTitle>🚀 Fast & Reliable</CardTitle>
            <CardDescription>
              Built on Cloudflare Workers for lightning-fast performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Experience edge computing at its finest with global CDN
              distribution
            </p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in-0 slide-in-from-bottom-6">
          <CardHeader>
            <CardTitle>🔒 Secure by Default</CardTitle>
            <CardDescription>
              Your data is protected with industry-standard encryption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              OAuth authentication and secure session management included
            </p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in-0 slide-in-from-bottom-7">
          <CardHeader>
            <CardTitle>💡 Modern Stack</CardTitle>
            <CardDescription>
              React 19, TypeScript, and the latest web technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stay ahead with cutting-edge tools and frameworks
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

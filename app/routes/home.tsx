import { useRouteLoaderData, Link } from "react-router";
import type { loader as layoutLoader } from "./layout";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [
    { title: "Comore - Modern Web Platform" },
    { name: "description", content: "Build amazing experiences with Comore" },
  ];
}

const features = [
  {
    title: "Lightning Fast",
    description: "Powered by Cloudflare Workers for edge computing performance",
    icon: "⚡",
    badge: "Edge",
  },
  {
    title: "Secure by Default",
    description: "Built-in authentication with GitHub OAuth integration",
    icon: "🔒",
    badge: "Auth",
  },
  {
    title: "Modern Stack",
    description: "React 19, TypeScript, and TailwindCSS v4 for the best DX",
    icon: "🚀",
    badge: "DX",
  },
  {
    title: "Database Ready",
    description: "Cloudflare D1 with Drizzle ORM for data persistence",
    icon: "💾",
    badge: "Data",
  },
];

export default function Home() {
  const loaderData = useRouteLoaderData<typeof layoutLoader>("routes/layout");
  const user = loaderData?.user;
  const isAuthenticated = loaderData?.isAuthenticated ?? false;

  return (
    <div className="space-y-12">
      <section className="text-center space-y-6 py-12">
        <h1 className="text-5xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom duration-500">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Comore
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-150">
          {isAuthenticated && user
            ? `Hello, @${user.handle}! Ready to build something amazing?`
            : "Build modern web applications with the power of edge computing"}
        </p>
        <div className="flex gap-4 justify-center animate-in fade-in slide-in-from-bottom duration-700 delay-300">
          {isAuthenticated && user ? (
            <>
              <Link to={`/${user.handle}`}>
                <Button
                  size="lg"
                  className="hover:scale-105 transition-transform"
                >
                  View Your Profile
                </Button>
              </Link>
              <Link to="/me/payment">
                <Button
                  size="lg"
                  variant="outline"
                  className="hover:scale-105 transition-transform"
                >
                  Manage Subscription
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/login/github">
              <Button
                size="lg"
                className="hover:scale-105 hover:shadow-lg transition-all"
              >
                Get Started →
              </Button>
            </Link>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-1000 delay-500">
        {features.map((feature, index) => (
          <Card
            key={feature.title}
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom"
            style={{ animationDelay: `${600 + index * 100}ms` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-4xl mb-2">{feature.icon}</div>
                <Badge variant="secondary" className="ml-auto">
                  {feature.badge}
                </Badge>
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="text-center space-y-4 pb-12 animate-in fade-in duration-1000 delay-1000">
        <h2 className="text-2xl font-semibold">Ready to dive in?</h2>
        <p className="text-muted-foreground">
          {isAuthenticated
            ? "Explore your dashboard and start building"
            : "Join thousands of developers building on Comore"}
        </p>
      </section>
    </div>
  );
}

import { useRouteLoaderData, useLoaderData, Link } from "react-router";
import type { loader as layoutLoader } from "./layout";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getTimelineArticles } from "@/lib/articles";
import { getCurrentSession } from "@/lib/sessions";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

export function meta() {
  return [
    { title: "Comore" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);
  
  if (!user) {
    return data({ articles: [], hasMore: false });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 20;

  const articlesResponse = await getTimelineArticles(context.db)({
    userId: user.id,
    page,
    limit,
  });

  return data(articlesResponse);
}

export default function Home() {
  const loaderData = useRouteLoaderData<typeof layoutLoader>("routes/layout");
  const { articles, hasMore } = useLoaderData<typeof loader>();
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
        <div className="space-y-6">
          <div className="flex gap-2">
            <Link to={`/${user.handle}`}>
              <Button>View Your Profile</Button>
            </Link>
            <Link to="/feeds">
              <Button variant="outline">Manage Feeds</Button>
            </Link>
            <Link to="/subscriptions">
              <Button variant="outline">Subscriptions</Button>
            </Link>
          </div>

          <Separator />

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Your Timeline</h2>
            {articles.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    No articles yet. Subscribe to users or teams to see their articles here.
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Link to="/teams">
                      <Button variant="outline" size="sm">Browse Teams</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <Card key={article.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg line-clamp-2">
                            <a 
                              href={article.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {article.title}
                            </a>
                          </CardTitle>
                          <CardDescription>
                            From {article.feed.title} • {" "}
                            {article.publishedAt 
                              ? new Date(article.publishedAt).toLocaleDateString()
                              : "No date"
                            }
                            {article.author && ` • By ${article.author}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {(article.description || article.ogImageUrl) && (
                      <CardContent>
                        {article.ogImageUrl && (
                          <img 
                            src={article.ogImageUrl} 
                            alt={article.title}
                            className="w-full h-48 object-cover rounded-md mb-3"
                          />
                        )}
                        {article.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {article.description}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
                
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Link to={`?page=${(Number(new URL(window.location.href).searchParams.get("page")) || 1) + 1}`}>
                      <Button variant="outline">Load More</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

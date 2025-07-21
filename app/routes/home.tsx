import {
  useRouteLoaderData,
  useLoaderData,
  Link,
  useSearchParams,
  useNavigation,
} from "react-router";
import type { loader as layoutLoader } from "./layout";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getTimelineArticles } from "~/lib/articles";
import { getCurrentSession } from "~/lib/sessions";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { ArticleList } from "~/components/articles/article-list";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  const currentPage = Number(searchParams.get("page") || "1");
  const isLoading = navigation.state === "loading";

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setSearchParams({ page: nextPage.toString() });
  };

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
            <ArticleList
              articles={articles}
              hasMore={hasMore && !isLoading}
              loadMore={handleLoadMore}
              emptyMessage="No articles yet. Subscribe to users or teams to see their articles here."
            />
            {articles.length === 0 && (
              <div className="flex justify-center gap-2">
                <Link to="/teams">
                  <Button variant="outline" size="sm">
                    Browse Teams
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import { ArticleCard } from "./article-card";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Newspaper } from "lucide-react";
import type { ArticleWithFeed } from "~/lib/articles/interface";

interface ArticleListProps {
  articles: ArticleWithFeed[];
  hasMore: boolean;
  loadMore?: () => void;
  emptyMessage?: string;
}

export function ArticleList({
  articles,
  hasMore,
  loadMore,
  emptyMessage = "No articles to display.",
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Newspaper className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      {hasMore && loadMore && (
        <div className="flex justify-center pt-4">
          <Button onClick={loadMore} variant="outline">
            Load More Articles
          </Button>
        </div>
      )}
    </div>
  );
}

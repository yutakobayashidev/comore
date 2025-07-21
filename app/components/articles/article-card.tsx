import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ExternalLink, Calendar, User } from "lucide-react";
import type { ArticleWithFeed } from "~/lib/articles/interface";

interface ArticleCardProps {
  article: ArticleWithFeed;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold line-clamp-2">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {article.title}
              </a>
            </h3>
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {article.feed.title}
            </Badge>
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            )}
            {article.author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.author}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      {(article.description || article.ogImageUrl) && (
        <CardContent>
          {article.ogImageUrl && (
            <img
              src={article.ogImageUrl}
              alt=""
              className="mb-3 rounded-md w-full h-48 object-cover"
              loading="lazy"
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
  );
}

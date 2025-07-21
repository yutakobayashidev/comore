export interface Article {
  id: number;
  feedId: number;
  title: string;
  url: string;
  description: string | null;
  content: string | null;
  author: string | null;
  ogImageUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateArticleParams {
  feedId: number;
  title: string;
  url: string;
  description?: string;
  content?: string;
  author?: string;
  ogImageUrl?: string;
  publishedAt?: Date;
}

export interface ArticleWithFeed extends Article {
  feed: {
    id: number;
    title: string;
    userId: number;
  };
}

export interface GetTimelineParams {
  userId: number;
  page?: number;
  limit?: number;
}

export interface GetArticlesParams {
  feedIds: number[];
  page?: number;
  limit?: number;
}

export interface ArticlesResponse {
  articles: ArticleWithFeed[];
  hasMore: boolean;
  totalCount: number;
}

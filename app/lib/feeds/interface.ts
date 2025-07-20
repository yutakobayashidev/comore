export interface Feed {
  id: number;
  userId: number;
  title: string;
  url: string;
  description: string | null;
  isActive: boolean;
  lastFetchedAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeedParams {
  userId: number;
  url: string;
  title?: string;
  description?: string;
}

export interface UpdateFeedParams {
  id: number;
  userId: number;
  title?: string;
  url?: string;
  isActive?: boolean;
}

export interface FeedError extends Error {
  code: "FEED_LIMIT_EXCEEDED" | "FEED_ALREADY_EXISTS" | "INVALID_FEED_URL";
}

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { getActiveFeeds, updateFeedFetchStatus } from "~/lib/feeds";
import { createArticle, checkArticleExists } from "~/lib/articles";
import type { Feed } from "~/lib/feeds/interface";
import Parser from "rss-parser";
import { parse as parseHtml } from "node-html-parser";

// Configuration
const BATCH_SIZE = 5;
const TIMEOUT_MS = 30000;

// Initialize RSS Parser
const parser = new Parser({
  timeout: TIMEOUT_MS,
  headers: {
    "User-Agent": "Comore RSS Aggregator/1.0",
  },
});

interface ParsedItem {
  title: string;
  link: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  author?: string;
}

async function fetchOpenGraphImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Comore RSS Aggregator/1.0",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const root = parseHtml(html);

    const ogImage = root.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const content = ogImage.getAttribute("content");
      if (content) return content;
    }

    const twitterImage = root.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      const content = twitterImage.getAttribute("content");
      if (content) return content;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch OpenGraph image for ${url}:`, error);
    return null;
  }
}

async function processFeed(
  context: ActionFunctionArgs["context"],
  feed: Feed,
): Promise<{ processed: number; errors: number }> {
  console.log(`Processing feed: ${feed.title} (${feed.url})`);
  let processed = 0;
  let errors = 0;

  try {
    const feedData = await parser.parseURL(feed.url);

    if (!feedData.items || feedData.items.length === 0) {
      await updateFeedFetchStatus(context.db)(feed.id);
      return { processed, errors };
    }

    for (const item of feedData.items as ParsedItem[]) {
      if (!item.link) continue;

      try {
        const exists = await checkArticleExists(context.db)(item.link);
        if (exists) continue;

        const ogImageUrl = await fetchOpenGraphImage(item.link);

        await createArticle(context.db)({
          feedId: feed.id,
          title: item.title || "Untitled",
          url: item.link,
          description: item.contentSnippet || item.content?.substring(0, 500),
          content: item.content,
          author: item.creator || item.author,
          ogImageUrl: ogImageUrl || undefined,
          publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        });
        processed++;
      } catch (error) {
        console.error(`Failed to create article: ${item.link}`, error);
        errors++;
      }
    }

    await updateFeedFetchStatus(context.db)(feed.id);
  } catch (error) {
    console.error(`Failed to process feed: ${feed.title}`, error);
    await updateFeedFetchStatus(context.db)(feed.id, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    errors++;
  }

  return { processed, errors };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // Verify API key for security
  const apiKey = request.headers.get("X-API-Key");
  const expectedKey = context.env.FEED_FETCH_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const feeds = await getActiveFeeds(context.db)();
    console.log(`Found ${feeds.length} active feeds to process`);

    let totalProcessed = 0;
    let totalErrors = 0;

    // Process feeds in batches
    for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
      const batch = feeds.slice(i, i + BATCH_SIZE);
      const promises = batch.map((feed) => processFeed(context, feed));
      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          totalProcessed += result.value.processed;
          totalErrors += result.value.errors;
        } else {
          totalErrors++;
        }
      });
    }

    return data({
      success: true,
      feeds: feeds.length,
      processed: totalProcessed,
      errors: totalErrors,
    });
  } catch (error) {
    console.error("Feed fetch failed:", error);
    return data(
      {
        error: "Feed fetch failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// This endpoint only accepts POST requests
export function loader() {
  return data({ error: "Method not allowed" }, { status: 405 });
}

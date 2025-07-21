#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/d1";
import { Miniflare } from "miniflare";
import Parser from "rss-parser";
import { parse as parseHtml } from "node-html-parser";
import * as schema from "../database/schema";
import { getActiveFeeds, updateFeedFetchStatus } from "../app/lib/feeds";
import { createArticle, checkArticleExists } from "../app/lib/articles";
import type { Feed } from "../app/lib/feeds/interface";

// Configuration
const BATCH_SIZE = 5; // Process feeds in batches
const TIMEOUT_MS = 30000; // 30 seconds timeout per feed

// Initialize RSS Parser
const parser = new Parser({
  timeout: TIMEOUT_MS,
  headers: {
    "User-Agent": "Comore RSS Aggregator/1.0",
  },
});

// Type for parsed feed item
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
      signal: AbortSignal.timeout(5000), // 5 second timeout
      headers: {
        "User-Agent": "Comore RSS Aggregator/1.0",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const root = parseHtml(html);

    // Try to find og:image
    const ogImage = root.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const content = ogImage.getAttribute("content");
      if (content) return content;
    }

    // Try to find twitter:image as fallback
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

async function processFeed(db: ReturnType<typeof drizzle>, feed: Feed) {
  console.log(`Processing feed: ${feed.title} (${feed.url})`);

  try {
    // Parse RSS feed
    const feedData = await parser.parseURL(feed.url);

    if (!feedData.items || feedData.items.length === 0) {
      console.log(`No items found in feed: ${feed.title}`);
      await updateFeedFetchStatus(db)(feed.id);
      return;
    }

    let newArticles = 0;

    // Process each item
    for (const item of feedData.items as ParsedItem[]) {
      if (!item.link) continue;

      // Check if article already exists
      const exists = await checkArticleExists(db)(item.link);
      if (exists) continue;

      // Fetch OpenGraph image
      const ogImageUrl = await fetchOpenGraphImage(item.link);

      // Create article
      try {
        await createArticle(db)({
          feedId: feed.id,
          title: item.title || "Untitled",
          url: item.link,
          description: item.contentSnippet || item.content?.substring(0, 500),
          content: item.content,
          author: item.creator || item.author,
          ogImageUrl: ogImageUrl || undefined,
          publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        });
        newArticles++;
      } catch (error) {
        console.error(`Failed to create article: ${item.link}`, error);
      }
    }

    console.log(`Added ${newArticles} new articles from ${feed.title}`);

    // Update feed fetch status
    await updateFeedFetchStatus(db)(feed.id);
  } catch (error) {
    console.error(`Failed to process feed: ${feed.title}`, error);
    await updateFeedFetchStatus(db)(feed.id, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function processFeedBatch(
  db: ReturnType<typeof drizzle>,
  feeds: Feed[],
) {
  const promises = feeds.map((feed) => processFeed(db, feed));
  await Promise.allSettled(promises);
}

async function main() {
  console.log("Starting RSS feed fetch...");

  // Initialize Miniflare for production D1 access
  const mf = new Miniflare({
    modules: true,
    script: "",
    d1Databases: [
      {
        binding: "DB",
        id: process.env.D1_DATABASE_ID || "DB",
      },
    ],
  });

  const env = await mf.getBindings();
  const db = drizzle(env.DB as any, { schema });

  try {
    // Get all active feeds
    const feeds = await getActiveFeeds(db)();
    console.log(`Found ${feeds.length} active feeds`);

    if (feeds.length === 0) {
      console.log("No active feeds to process");
      return;
    }

    // Process feeds in batches
    for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
      const batch = feeds.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(feeds.length / BATCH_SIZE)}`,
      );
      await processFeedBatch(db, batch);
    }

    console.log("Feed fetch completed successfully");
  } catch (error) {
    console.error("Feed fetch failed:", error);
    process.exit(1);
  } finally {
    await mf.dispose();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

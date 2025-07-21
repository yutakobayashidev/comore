#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/d1";
import { D1Database } from "@cloudflare/workers-types";
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
  feeds: Feed[]
) {
  const promises = feeds.map((feed) => processFeed(db, feed));
  await Promise.allSettled(promises);
}

async function main() {
  console.log("Starting RSS feed fetch...");

  // For GitHub Actions, we'll use wrangler to execute a script
  // that runs within the Cloudflare Workers environment
  const { execSync } = await import("child_process");
  
  try {
    // Use wrangler to execute the fetch operation
    execSync(`pnpm wrangler d1 execute ${process.env.D1_DATABASE_NAME || "DB"} --command "SELECT 1"`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      }
    });
    
    console.log("Connected to D1 database successfully");
    
    // Note: Direct D1 access from external scripts is not straightforward
    // The recommended approach is to create an API endpoint in your Worker
    // that handles the feed fetching, then call it from this script
    
    console.log("Please implement a Worker endpoint for feed fetching");
    console.log("Then call it from this script using fetch()");
    
  } catch (error) {
    console.error("Failed to connect to D1:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
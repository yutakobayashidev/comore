#!/usr/bin/env tsx

import "dotenv/config";
import Parser from "rss-parser";
import { parse as parseHtml } from "node-html-parser";
import db from "../app/lib/d1-http";
import { getActiveFeeds, updateFeedFetchStatus } from "../app/lib/feeds";
import { createArticle, checkArticleExists } from "../app/lib/articles";
import type { Feed } from "../app/lib/feeds/interface";

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
  feed: Feed,
): Promise<{ processed: number; errors: number }> {
  console.log(`Processing feed: ${feed.title} (${feed.url})`);
  let processed = 0;
  let errors = 0;

  try {
    const feedData = await parser.parseURL(feed.url);

    if (!feedData.items || feedData.items.length === 0) {
      await updateFeedFetchStatus(db)(feed.id);
      return { processed, errors };
    }

    for (const item of feedData.items as ParsedItem[]) {
      if (!item.link) continue;

      try {
        const exists = await checkArticleExists(db)(item.link);
        if (exists) continue;

        const ogImageUrl = await fetchOpenGraphImage(item.link);

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
        processed++;
      } catch (error) {
        console.error(`Failed to create article: ${item.link}`, error);
        errors++;
      }
    }

    await updateFeedFetchStatus(db)(feed.id);
  } catch (error) {
    console.error(`Failed to process feed: ${feed.title}`, error);
    await updateFeedFetchStatus(db)(feed.id, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    errors++;
  }

  return { processed, errors };
}

async function main() {
  console.log("Starting feed fetch...");

  try {
    const feeds = await getActiveFeeds(db)();
    console.log(`Found ${feeds.length} active feeds to process`);

    let totalProcessed = 0;
    let totalErrors = 0;

    // Process feeds in batches
    for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
      const batch = feeds.slice(i, i + BATCH_SIZE);
      const promises = batch.map((feed) => processFeed(feed));
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

    console.log("Feed fetch completed:");
    console.log(`- Feeds processed: ${feeds.length}`);
    console.log(`- Articles created: ${totalProcessed}`);
    console.log(`- Errors: ${totalErrors}`);

    process.exit(0);
  } catch (error) {
    console.error("Feed fetch failed:", error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

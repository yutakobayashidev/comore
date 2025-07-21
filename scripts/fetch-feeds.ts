#!/usr/bin/env tsx

async function main() {
  console.log("Starting RSS feed fetch...");

  const apiUrl = process.env.API_URL || "http://localhost:5173";
  const apiKey = process.env.FEED_FETCH_API_KEY;

  if (!apiKey) {
    console.error("FEED_FETCH_API_KEY environment variable is required");
    process.exit(1);
  }

  try {
    const response = await fetch(`${apiUrl}/api/feeds/fetch`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    console.log("Feed fetch completed successfully");
    console.log(`Processed ${result.processed} articles from ${result.feeds} feeds`);
    
    if (result.errors > 0) {
      console.warn(`Encountered ${result.errors} errors during processing`);
    }
  } catch (error) {
    console.error("Feed fetch failed:", error);
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
# RSS Feed Aggregator Setup Guide

## Overview

The RSS Feed Aggregator feature allows users to:

- Add RSS/Atom feeds (5 for free users, 50 for paid users)
- Subscribe to other users and teams
- View aggregated articles in a timeline

## Environment Setup

### Required Environment Variables

1. **For GitHub Actions**:
   - `PRODUCTION_URL`: Your production app URL (set as repository variable)
   - `FEED_FETCH_API_KEY`: Secret API key for feed fetching (set as repository secret)

2. **For Cloudflare Workers**:
   - `FEED_FETCH_API_KEY`: Same API key as above (set in wrangler.toml or dashboard)

### Setting up GitHub Secrets

1. Go to your repository Settings → Secrets and variables → Actions
2. Add the following:
   - Repository secrets:
     - `FEED_FETCH_API_KEY`: Generate a secure random string
   - Repository variables:
     - `PRODUCTION_URL`: Your production URL (e.g., https://your-app.workers.dev)

### Setting up Cloudflare Environment

Add to your `wrangler.toml`:

```toml
[vars]
FEED_FETCH_API_KEY = "your-api-key-here"
```

Or set it via the Cloudflare dashboard in your Worker's settings.

## Database Setup

Run the migrations to create the new tables:

```bash
# Local development
pnpm db:migrate

# Production
pnpm db:migrate-production
```

## Testing the Feed Fetcher

### Local Testing

1. Start the dev server:

   ```bash
   pnpm dev
   ```

2. Run the feed fetcher:
   ```bash
   API_URL=http://localhost:5173 FEED_FETCH_API_KEY=your-test-key pnpm feed:fetch
   ```

### Manual Trigger in GitHub

1. Go to Actions → Fetch RSS Feeds
2. Click "Run workflow"
3. Select the branch and run

## Monitoring

- Check GitHub Actions logs for fetch results
- Monitor the `feeds` table for `lastErrorAt` and `lastErrorMessage`
- Check the `articles` table for newly added content

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that `FEED_FETCH_API_KEY` matches in both environments
2. **Feed parsing errors**: Check feed URLs are valid RSS/Atom feeds
3. **No articles appearing**: Verify feeds are active and contain recent items
4. **GitHub Action failing**: Check the uploaded artifacts for detailed logs

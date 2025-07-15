# Stripe Seed Scripts

This directory contains scripts to create Stripe products and prices for development and testing.

## Prerequisites

Make sure you have set up your Stripe API keys in `.dev.vars`:

```
STRIPE_SECRET_KEY=sk_test_...
```

## Available Scripts

### Create Multiple Plans (Subscription Products)

This creates Basic, Pro, and Enterprise plans with monthly and yearly pricing:

```bash
pnpm stripe:seed
```

### Create Single Test Price

This creates a single one-time payment product for testing:

```bash
pnpm stripe:seed:single
```

After running this command, copy the generated `STRIPE_PRICE_ID` to your `.dev.vars` file.

## Usage in Application

The created prices can be used in your checkout sessions. The seed scripts will output the Price IDs that you can use in your application.

For subscription plans, you'll typically want to:

1. Display the available plans to users
2. Let them select a plan
3. Create a checkout session with the selected price ID

For one-time payments, use the single price ID in your checkout configuration.

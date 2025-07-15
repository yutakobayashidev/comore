import Stripe from "stripe";
import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".dev.vars") });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is required in .dev.vars");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
  typescript: true,
});

interface PlanConfig {
  productName: string;
  productDescription: string;
  prices: Array<{
    nickname: string;
    unitAmount: number;
    currency: string;
    interval?: "month" | "year";
    intervalCount?: number;
  }>;
}

const plans: PlanConfig[] = [
  {
    productName: "Basic Plan",
    productDescription: "Essential features for individuals",
    prices: [
      {
        nickname: "Basic Monthly",
        unitAmount: 1000, // $10.00
        currency: "usd",
        interval: "month",
        intervalCount: 1,
      },
      {
        nickname: "Basic Yearly",
        unitAmount: 10000, // $100.00
        currency: "usd",
        interval: "year",
        intervalCount: 1,
      },
    ],
  },
  {
    productName: "Pro Plan",
    productDescription: "Advanced features for professionals",
    prices: [
      {
        nickname: "Pro Monthly",
        unitAmount: 2500, // $25.00
        currency: "usd",
        interval: "month",
        intervalCount: 1,
      },
      {
        nickname: "Pro Yearly",
        unitAmount: 25000, // $250.00
        currency: "usd",
        interval: "year",
        intervalCount: 1,
      },
    ],
  },
  {
    productName: "Enterprise Plan",
    productDescription: "Custom solutions for teams",
    prices: [
      {
        nickname: "Enterprise Monthly",
        unitAmount: 10000, // $100.00
        currency: "usd",
        interval: "month",
        intervalCount: 1,
      },
      {
        nickname: "Enterprise Yearly",
        unitAmount: 100000, // $1000.00
        currency: "usd",
        interval: "year",
        intervalCount: 1,
      },
    ],
  },
];

async function seedStripePlans() {
  console.log("🌱 Starting Stripe plans seed...\n");

  try {
    for (const plan of plans) {
      console.log(`Creating product: ${plan.productName}`);

      // Create product
      const product = await stripe.products.create({
        name: plan.productName,
        description: plan.productDescription,
      });

      console.log(`✅ Product created: ${product.id}`);

      // Create prices for the product
      for (const priceConfig of plan.prices) {
        console.log(`  Creating price: ${priceConfig.nickname}`);

        const priceData: Stripe.PriceCreateParams = {
          product: product.id,
          unit_amount: priceConfig.unitAmount,
          currency: priceConfig.currency,
          nickname: priceConfig.nickname,
        };

        // Add recurring config if it's a subscription
        if (priceConfig.interval) {
          priceData.recurring = {
            interval: priceConfig.interval,
            interval_count: priceConfig.intervalCount || 1,
          };
        }

        const price = await stripe.prices.create(priceData);

        console.log(
          `  ✅ Price created: ${price.id} (${priceConfig.nickname})`,
        );
      }

      console.log(""); // Empty line for readability
    }

    console.log("🎉 All plans created successfully!");

    // List all active prices
    console.log("\n📋 Active prices:");
    const prices = await stripe.prices.list({ active: true, limit: 100 });

    for (const price of prices.data) {
      const product =
        typeof price.product === "string"
          ? await stripe.products.retrieve(price.product)
          : price.product;

      if ("deleted" in product && product.deleted) {
        console.log(`- Deleted product (${price.nickname}): ${price.id}`);
      } else {
        console.log(`- ${product.name} (${price.nickname}): ${price.id}`);
      }
    }
  } catch (error) {
    console.error("❌ Error creating plans:", error);
    process.exit(1);
  }
}

// Run the seed function
seedStripePlans()
  .then(() => {
    console.log("\n✨ Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

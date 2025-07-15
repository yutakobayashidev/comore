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

async function createSinglePrice() {
  console.log("🌱 Creating a single price for testing...\n");

  try {
    // Create a product
    const product = await stripe.products.create({
      name: "Test Product",
      description: "A test product for development",
    });

    console.log(`✅ Product created: ${product.id}`);

    // Create a one-time price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 5000, // $50.00
      currency: "usd",
      nickname: "One-time payment",
    });

    console.log(`✅ Price created: ${price.id}`);
    console.log(`\n📋 Add this to your .dev.vars file:`);
    console.log(`STRIPE_PRICE_ID=${price.id}`);
  } catch (error) {
    console.error("❌ Error creating price:", error);
    process.exit(1);
  }
}

// Run the function
createSinglePrice()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

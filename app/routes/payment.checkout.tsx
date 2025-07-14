import { useState, useEffect, useMemo } from "react";
import { CheckoutProvider } from "@stripe/react-stripe-js";
import { useLoaderData, useFetcher } from "react-router";
import { getStripe } from "~/lib/stripe-client";
import { CheckoutForm } from "~/components/payment/checkout-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

// In production, this should come from environment variables
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51RkfNsQD7mChZM2RwZGMWVgPN4bqPTr5UOgdhkwIQ2BatR3oYOBZqRcMn17UGvFC06WjMacACuxjDqYKDvVBTLHT00HtxZxyt4";

export async function loader() {
  // You could pass the publishable key from server-side environment
  return {
    publishableKey: STRIPE_PUBLISHABLE_KEY,
  };
}

export default function CheckoutPage() {
  const { publishableKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data && !clientSecret) {
      fetcher.submit(null, { method: "POST", action: "/api/payment/checkout" });
    }
  }, [fetcher, clientSecret]);

  useEffect(() => {
    if (fetcher.data?.clientSecret) {
      setClientSecret(fetcher.data.clientSecret);
    }
  }, [fetcher.data]);

  const stripePromise = useMemo(
    () => getStripe(publishableKey),
    [publishableKey],
  );

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#000000",
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete your purchase</CardTitle>
          <CardDescription>Enter your payment details below</CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutProvider
            stripe={stripePromise}
            options={{
              fetchClientSecret: async () => clientSecret,
              elementsOptions: { appearance },
            }}
          >
            <CheckoutForm />
          </CheckoutProvider>
        </CardContent>
      </Card>
    </div>
  );
}

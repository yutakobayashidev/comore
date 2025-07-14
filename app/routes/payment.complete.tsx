import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface SessionStatus {
  status: string;
  payment_status: string;
  payment_intent_id: string;
  payment_intent_status: string;
  error?: string;
}

export default function PaymentCompletePage() {
  const [searchParams] = useSearchParams();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/payment/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setSessionStatus(data as SessionStatus);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch session status:", error);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
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

  if (!sessionId || !sessionStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Session</CardTitle>
            <CardDescription>No valid session ID found</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/payment/checkout">Return to checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccess =
    sessionStatus.status === "complete" &&
    sessionStatus.payment_status === "paid";

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            {isSuccess ? (
              <div className="rounded-full bg-green-500 p-2">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            ) : (
              <div className="rounded-full bg-red-500 p-2">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <CardTitle>
                {isSuccess ? "Payment Successful" : "Payment Failed"}
              </CardTitle>
              <CardDescription>
                {isSuccess
                  ? "Your payment has been processed successfully"
                  : "Something went wrong with your payment"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-semibold mb-2">Payment Details</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment Intent ID</dt>
                <dd className="font-mono text-xs">
                  {sessionStatus.payment_intent_id}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Session Status</dt>
                <dd>{sessionStatus.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment Status</dt>
                <dd>{sessionStatus.payment_status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment Intent Status</dt>
                <dd>{sessionStatus.payment_intent_status}</dd>
              </div>
            </dl>
          </div>

          {sessionStatus.payment_intent_id && (
            <Button asChild variant="outline" className="w-full">
              <a
                href={`https://dashboard.stripe.com/test/payments/${sessionStatus.payment_intent_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View in Stripe Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}

          <Button asChild className="w-full">
            <Link to="/payment/checkout">
              {isSuccess ? "Make Another Payment" : "Try Again"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

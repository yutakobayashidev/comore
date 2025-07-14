import { useState } from "react";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2 } from "lucide-react";

const validateEmail = async (email: string, checkout: any) => {
  const updateResult = await checkout.updateEmail(email);
  const isValid = updateResult.type !== "error";

  return { isValid, message: !isValid ? updateResult.error.message : null };
};

interface EmailInputProps {
  email: string;
  setEmail: (email: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const EmailInput = ({ email, setEmail, error, setError }: EmailInputProps) => {
  const checkout = useCheckout();

  const handleBlur = async () => {
    if (!email) {
      return;
    }

    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid && message) {
      setError(message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setEmail(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={handleChange}
        onBlur={handleBlur}
        className={error ? "border-destructive" : ""}
        placeholder="Enter your email"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export function CheckoutForm() {
  const checkout = useCheckout();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    const { isValid, message } = await validateEmail(email, checkout);
    if (!isValid && message) {
      setEmailError(message);
      setMessage(message);
      setIsLoading(false);
      return;
    }

    const confirmResult = await checkout.confirm();

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`.
    if (confirmResult.type === "error") {
      setMessage(confirmResult.error.message || "An error occurred");
    }

    setIsLoading(false);
  };

  const totalAmount = (checkout as any).total?.total?.amount || 0;
  const currency = (checkout as any).total?.total?.currency || "usd";
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(totalAmount) / 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <EmailInput
        email={email}
        setEmail={setEmail}
        error={emailError}
        setError={setEmailError}
      />

      <div className="space-y-2">
        <h4 className="font-medium">Payment</h4>
        <PaymentElement id="payment-element" />
      </div>

      <Button type="submit" disabled={isLoading || !email} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formattedAmount} now`
        )}
      </Button>

      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

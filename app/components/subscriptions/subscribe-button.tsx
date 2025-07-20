import { useFetcher } from "react-router";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

interface SubscribeButtonProps {
  isSubscribed: boolean;
  targetType: "user" | "team";
  targetId: number | string;
  className?: string;
}

export function SubscribeButton({
  isSubscribed,
  targetType,
  targetId,
  className,
}: SubscribeButtonProps) {
  const fetcher = useFetcher();
  
  const isLoading = fetcher.state !== "idle";
  const optimisticIsSubscribed = fetcher.formData
    ? fetcher.formData.get("_action") === "subscribe"
    : isSubscribed;

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="_targetType" value={targetType} />
      <input type="hidden" name="_targetId" value={targetId} />
      <Button
        type="submit"
        name="_action"
        value={optimisticIsSubscribed ? "unsubscribe" : "subscribe"}
        variant={optimisticIsSubscribed ? "secondary" : "default"}
        disabled={isLoading}
        className={className}
      >
        {optimisticIsSubscribed ? (
          <>
            <BellOff className="mr-2 h-4 w-4" />
            {isLoading ? "Updating..." : "Unsubscribe"}
          </>
        ) : (
          <>
            <Bell className="mr-2 h-4 w-4" />
            {isLoading ? "Updating..." : "Subscribe"}
          </>
        )}
      </Button>
    </fetcher.Form>
  );
}
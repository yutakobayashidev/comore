import { redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/me.payment";
import { getCurrentSession } from "~/lib/auth/session";
import { subscriptions } from "~/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { CalendarIcon, CreditCardIcon } from "lucide-react";

export async function loader({ context, request }: Route.LoaderArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const subscription = await context.db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        inArray(subscriptions.status, ["active", "complete"]),
      ),
    )
    .limit(1);

  const subscriptionData = subscription[0];

  if (!subscriptionData) {
    return {
      subscription: null,
    };
  }

  return {
    subscription: {
      subscriptionId: subscriptionData.subscriptionId,
      status: subscriptionData.status,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
    },
  };
}

export default function PaymentPage() {
  const { subscription } = useLoaderData<typeof loader>();

  if (!subscription) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>支払い情報</CardTitle>
            <CardDescription>
              現在有効なサブスクリプションはありません
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              サブスクリプションに登録すると、すべての機能にアクセスできます。
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/payment/checkout">サブスクリプションを開始</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (status === "active" && cancelAtPeriodEnd) {
      return <Badge variant="secondary">解約予定</Badge>;
    }
    if (status === "active") {
      return <Badge variant="default">有効</Badge>;
    }
    if (status === "complete") {
      return <Badge variant="secondary">完了</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">支払い情報</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>サブスクリプション</CardTitle>
            {getStatusBadge(
              subscription.status,
              subscription.cancelAtPeriodEnd,
            )}
          </div>
          <CardDescription>
            現在のサブスクリプションプランの詳細
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">サブスクリプションID:</span>
            <span className="text-sm text-muted-foreground">
              {subscription.subscriptionId}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">次回請求日:</span>
            <span className="text-sm text-muted-foreground">
              {subscription.currentPeriodEnd?.toISOString()}
            </span>
          </div>
          {subscription.cancelAtPeriodEnd && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                このサブスクリプションは{" "}
                {subscription.currentPeriodEnd?.toISOString()}
                に解約されます。それまではすべての機能をご利用いただけます。
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <form method="post" className="w-full">
            <Button
              type="submit"
              name="action"
              value="manage-billing"
              variant="outline"
              className="w-full"
            >
              請求情報を管理
            </Button>
          </form>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>よくある質問</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">
              サブスクリプションをキャンセルするには？
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              「請求情報を管理」ボタンをクリックして、Stripeの請求ポータルからキャンセルできます。
            </p>
          </div>
          <div>
            <h3 className="font-medium">プランを変更するには？</h3>
            <p className="text-sm text-muted-foreground mt-1">
              請求ポータルから現在のプランをアップグレードまたはダウングレードできます。
            </p>
          </div>
          <div>
            <h3 className="font-medium">支払い方法を更新するには？</h3>
            <p className="text-sm text-muted-foreground mt-1">
              請求ポータルから支払い方法を追加、削除、または更新できます。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

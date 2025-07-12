import { data, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as UIForm,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { getCurrentSession } from "~/lib/auth/session";
import { eq } from "drizzle-orm";
import schema from "../../database/schema";

const formSchema = z.object({
  feeds: z
    .array(
      z.object({
        url: z.string().url({ message: "有効なURLを入力してください" }).min(1),
      }),
    )
    .max(10, { message: "RSSフィードは最大10個まで登録できます" }),
});

type FormData = z.infer<typeof formSchema>;

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  // ユーザーの既存のフィードを取得
  const userFeedsData = await context.db
    .select({
      url: schema.feeds.url,
    })
    .from(schema.userFeeds)
    .innerJoin(schema.feeds, eq(schema.userFeeds.feedId, schema.feeds.id))
    .where(eq(schema.userFeeds.userId, user.id));

  return data({
    user,
    feeds: userFeedsData.length > 0 ? userFeedsData : [{ url: "" }],
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  if (!user) {
    return redirect("/login/github");
  }

  const formData = await request.formData();

  // フォームデータからフィードURLを抽出
  const feedUrls = [];
  for (const [key, value] of formData.entries()) {
    if (key.match(/^feeds\[\d+\]\[url\]$/) && value) {
      feedUrls.push(value.toString());
    }
  }

  // 既存のユーザーフィードを削除
  await context.db
    .delete(schema.userFeeds)
    .where(eq(schema.userFeeds.userId, user.id));

  // 新しいフィードを保存
  for (const url of feedUrls) {
    // フィードがすでに存在するか確認
    const existingFeed = await context.db
      .select()
      .from(schema.feeds)
      .where(eq(schema.feeds.url, url))
      .get();

    let feedId;
    if (existingFeed) {
      feedId = existingFeed.id;
    } else {
      // 新しいフィードを作成
      const newFeedId = crypto.randomUUID();
      await context.db.insert(schema.feeds).values({
        id: newFeedId,
        url,
        createdAt: new Date(),
      });
      feedId = newFeedId;
    }

    // ユーザーとフィードを関連付け
    await context.db.insert(schema.userFeeds).values({
      userId: user.id,
      feedId,
      createdAt: new Date(),
    });
  }

  return redirect("/settings");
}

export default function Settings() {
  const { feeds } = useLoaderData<typeof loader>();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feeds: feeds,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "feeds",
  });

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    data.feeds.forEach((feed, index) => {
      formData.append(`feeds[${index}][url]`, feed.url);
    });

    const response = await fetch("/settings", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      // TODO: 成功メッセージを表示
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>設定</CardTitle>
          <CardDescription>
            RSSフィードのURLを登録できます（最大10個まで）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UIForm {...form}>
            <Form
              method="post"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`feeds.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={index === 0 ? "" : "sr-only"}>
                          RSS フィード URL
                        </FormLabel>
                        <FormDescription
                          className={index === 0 ? "" : "sr-only"}
                        >
                          RSSフィードのURLを入力してください
                        </FormDescription>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://example.com/feed.xml"
                              type="url"
                            />
                          </FormControl>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {fields.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ url: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  フィードを追加
                </Button>
              )}

              <div className="flex justify-end">
                <Button type="submit">保存</Button>
              </div>
            </Form>
          </UIForm>
        </CardContent>
      </Card>
    </div>
  );
}

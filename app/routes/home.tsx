import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { getCurrentSession } from "~/lib/auth/session";
import { Welcome } from "../welcome/welcome";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await getCurrentSession(context.db)(request);

  return {
    user,
    isAuthenticated: !!user,
  };
}

export default function Home() {
  const { user, isAuthenticated } = useLoaderData<typeof loader>();

  return (
    <div>
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
        }}
      >
        {isAuthenticated ? (
          <div>
            <h3>ログイン中</h3>
            <p>ユーザー名: {user?.username}</p>
            <p>メール: {user?.email}</p>
            <p>GitHub ID: {user?.githubId}</p>
          </div>
        ) : (
          <div>
            <h3>未ログイン</h3>
            <p>ログインしてください</p>
          </div>
        )}
      </div>
      <Welcome />
    </div>
  );
}

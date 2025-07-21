import { useRouteLoaderData, Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { loader as layoutLoader } from "./layout";
import { Button } from "~/components/ui/button";

export function meta() {
  // For now, we'll use static values since context isn't available in meta
  return [
    { title: "Comore" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const { t } = useTranslation();
  const loaderData = useRouteLoaderData<typeof layoutLoader>("routes/layout");
  const user = loaderData?.user;
  const isAuthenticated = loaderData?.isAuthenticated ?? false;

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">{t("home.welcome")}</h1>
      <p className="text-lg text-muted-foreground mb-6">
        {isAuthenticated && user
          ? t("home.loggedInMessage", { username: `@${user.handle}` })
          : t("home.notLoggedInMessage")}
      </p>
      {isAuthenticated && user && (
        <Link to={`/${user.handle}`}>
          <Button>View Your Profile</Button>
        </Link>
      )}
    </>
  );
}

import { unstable_createI18nextMiddleware } from "remix-i18next/middleware";
import resources from "~/locales";

export const [i18nextMiddleware, getLocale, getInstance] =
  unstable_createI18nextMiddleware({
    detection: {
      supportedLanguages: ["en", "ja"],
      fallbackLanguage: "en",
    },
    i18next: {
      resources: {
        en: { translation: resources.en },
        ja: { translation: resources.ja },
      },
    },
  });

declare module "i18next" {
  interface CustomTypeOptions {
    resources: typeof resources.en;
  }
}

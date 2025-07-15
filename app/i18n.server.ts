import { unstable_createI18nextMiddleware } from "remix-i18next/middleware";
import { localeCookie } from "~/cookies";
import en from "~/locales/en";
import ja from "~/locales/ja";

export const [i18nextMiddleware, getLocale, getInstance] =
  unstable_createI18nextMiddleware({
    detection: {
      supportedLanguages: ["en", "ja"],
      fallbackLanguage: "en",
      cookie: localeCookie,
    },
    i18next: {
      resources: {
        en: { translation: en },
        ja: { translation: ja },
      },
    },
  });

export { localeCookie };

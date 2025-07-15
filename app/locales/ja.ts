import type en from "./en";

export default {
  common: {
    appName: "Comore",
    login: "ログイン",
    logout: "ログアウト",
    loading: "読み込み中...",
    error: "エラー",
    success: "成功",
  },
  home: {
    title: "Comore",
    description: "React Routerへようこそ！",
    welcome: "Comoreへようこそ",
    loggedInMessage: "{{username}}としてログインしています。",
    notLoggedInMessage:
      "ダッシュボードにアクセスするにはログインしてください。",
  },
  header: {
    githubId: "GitHub ID",
  },
  auth: {
    loginRequired: "ログインが必要です",
    loginWithGithub: "GitHubでログイン",
  },
  payment: {
    missingStripeSignature: "Stripeの署名がありません",
    webhookSignatureVerificationFailed: "Webhookの署名検証に失敗しました",
  },
  profile: {
    titlePrefix: "@{{handle}} - Comore",
    profileOf: "@{{handle}}のプロフィール",
  },
  errors: {
    notFound: "ページが見つかりません",
    serverError: "問題が発生しました",
  },
} satisfies typeof en;

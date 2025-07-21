# RSSフィードアグリゲーター機能 設計書

## 1. 概要

要件定義書に基づき、RSSフィードアグリゲーター機能の技術設計を定義する。

## 2. データベース設計

### 2.1 新規テーブル

#### 2.1.1 feeds（フィード）

```sql
CREATE TABLE feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  lastFetchedAt TIMESTAMP,
  lastErrorAt TIMESTAMP,
  lastErrorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, url)
);
```

#### 2.1.2 articles（記事）

```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedId INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  content TEXT,
  author TEXT,
  ogImageUrl TEXT,
  publishedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feedId) REFERENCES feeds(id) ON DELETE CASCADE,
  UNIQUE(url)
);
```

#### 2.1.3 user_subscriptions（ユーザー購読）

```sql
CREATE TABLE user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriberId INTEGER NOT NULL,
  targetUserId INTEGER NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriberId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (targetUserId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(subscriberId, targetUserId)
);
```

#### 2.1.4 team_subscriptions（チーム購読）

```sql
CREATE TABLE team_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriberId INTEGER NOT NULL,
  targetTeamId INTEGER NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriberId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (targetTeamId) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(subscriberId, targetTeamId)
);
```

### 2.2 インデックス設計

```sql
-- 記事の高速検索用
CREATE INDEX idx_articles_feedId_publishedAt ON articles(feedId, publishedAt DESC);
CREATE INDEX idx_articles_publishedAt ON articles(publishedAt DESC);

-- フィード検索用
CREATE INDEX idx_feeds_userId ON feeds(userId);
CREATE INDEX idx_feeds_isActive ON feeds(isActive);

-- 購読検索用
CREATE INDEX idx_user_subscriptions_subscriberId ON user_subscriptions(subscriberId);
CREATE INDEX idx_team_subscriptions_subscriberId ON team_subscriptions(subscriberId);
```

## 3. ルート設計（React Router v7）

### 3.1 フィード管理ルート

#### /feeds - フィード管理ページ

- **loader**: ユーザーのフィード一覧を取得
  - Return: `{ feeds: Feed[], hasActiveSubscription: boolean, feedCount: number }`
- **action**: フィードの新規登録
  - FormData: `{ url: string, title?: string }`
  - 制限チェック：無料5個、有料50個

#### /feeds/:id/edit - フィード編集ページ

- **loader**: フィード詳細を取得
  - Return: `{ feed: Feed }`
- **action**: フィードの更新・削除
  - FormData: `{ _action: "update" | "delete", title?: string, url?: string, isActive?: boolean }`

### 3.2 購読管理ルート

#### /subscriptions - 購読管理ページ

- **loader**: 購読一覧を取得
  - Return: `{ userSubscriptions: UserSubscription[], teamSubscriptions: TeamSubscription[] }`

#### /users/:userId - ユーザープロフィールページ

- **loader**: ユーザー情報と記事一覧を取得
  - Query: `?page=1&limit=20`
  - Return: `{ user: User, articles: Article[], hasMore: boolean, isSubscribed: boolean }`
- **action**: ユーザー購読の追加・解除
  - FormData: `{ _action: "subscribe" | "unsubscribe" }`

#### /teams/:slug - チームページ

- **loader**: チーム情報と記事一覧を取得
  - Query: `?page=1&limit=20`
  - Return: `{ team: Team, articles: Article[], hasMore: boolean, isSubscribed: boolean }`
- **action**: チーム購読の追加・解除
  - FormData: `{ _action: "subscribe" | "unsubscribe" }`

### 3.3 記事表示ルート

#### / - トップページ（タイムライン）

- **loader**: 購読したユーザー/チームの記事を取得
  - Query: `?page=1&limit=20`
  - Return: `{ articles: Article[], hasMore: boolean, isAuthenticated: boolean }`

#### /articles - 記事一覧ページ

- **loader**: フィルタリング可能な記事一覧
  - Query: `?userId=1&teamId=2&page=1&limit=20`
  - Return: `{ articles: Article[], hasMore: boolean, filters: FilterOptions }`

## 4. UIコンポーネント設計

### 4.1 フィード管理コンポーネント

#### FeedList

- ユーザーのフィード一覧表示
- 編集・削除ボタン
- アクティブ/非アクティブ切り替え

#### FeedForm

- フィードURL入力フォーム
- URLバリデーション
- 登録上限チェック表示

### 4.2 購読管理コンポーネント

#### SubscriptionList

- 購読中のユーザー/チーム一覧
- 購読解除ボタン

#### SubscribeButton

- ユーザー/チームページに配置
- 購読/購読解除の切り替え

### 4.3 記事表示コンポーネント

#### ArticleList

- 記事一覧表示（タイムライン形式）
- ページネーション対応
- 記事カード形式

#### ArticleCard

- タイトル、概要、公開日時、著者
- OpenGraph画像の表示（あれば）
- 元のサイトへのリンク
- フィード情報表示

## 5. データフロー設計

### 5.1 フィード登録フロー

1. ユーザーがURLを入力
2. サブスクリプション状態を確認
3. 登録数制限チェック
4. フィードURLの有効性確認（RSS/Atom形式）
5. フィード情報をDBに保存

### 5.2 記事収集フロー（GitHub Actions）

1. アクティブなフィードを取得
2. 各フィードからRSS/Atomデータを取得
3. 新着記事を抽出（URL重複チェック）
4. 記事情報をパース（OpenGraph画像URLの取得を含む）
5. DBに保存
6. エラー情報を記録

### 5.3 タイムライン表示フロー

1. ログインユーザーの購読情報を取得
2. 購読ユーザー/チームのメンバーを特定
3. 対象ユーザーの記事を取得
4. 時系列でソート（重複除去）
5. ページネーション適用

## 6. GitHub Actions設計

### 6.1 定期実行ワークフロー

```yaml
name: Fetch RSS Feeds
on:
  schedule:
    - cron: "0 * * * *" # 毎時0分に実行
  workflow_dispatch: # 手動実行も可能

jobs:
  fetch-feeds:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm tsx scripts/fetch-feeds.ts
```

### 6.2 フィード取得スクリプト設計

- 並行実行制御（同時実行数制限）
- タイムアウト設定
- エラーハンドリング
- 部分的失敗の許容
- D1データベースへの直接接続

## 7. セキュリティ設計

### 7.1 入力検証

- RSS/AtomフィードURLの検証
- XSS対策（DOMPurifyによるサニタイズ）
- SQLインジェクション対策（Drizzle ORMの使用）

### 7.2 アクセス制御

- 自分のフィードのみ編集可能
- 購読は認証ユーザーのみ
- APIレート制限

## 8. パフォーマンス最適化

### 8.1 データベース

- 適切なインデックス設計
- N+1問題の回避（JOIN使用）

### 8.2 フロントエンド

- 無限スクロール/ページネーション
- 記事データのキャッシュ
- 画像の遅延読み込み

### 8.3 バックグラウンド処理

- フィード取得の並行実行
- 失敗時のリトライ機構
- タイムアウト設定

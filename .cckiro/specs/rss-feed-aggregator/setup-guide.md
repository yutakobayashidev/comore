# RSSフィードアグリゲーター セットアップガイド

## 概要

RSSフィードアグリゲーター機能により、ユーザーは以下のことができます：

- RSS/Atomフィードの追加（無料ユーザーは5個、有料ユーザーは50個まで）
- 他のユーザーやチームの購読
- タイムラインでの集約記事の閲覧

## 環境設定

### 必要な環境変数

1. **GitHub Actions用**：
   - `PRODUCTION_URL`: 本番アプリのURL（リポジトリ変数として設定）
   - `FEED_FETCH_API_KEY`: フィード取得用のシークレットAPIキー（リポジトリシークレットとして設定）

2. **Cloudflare Workers用**：
   - `FEED_FETCH_API_KEY`: 上記と同じAPIキー（wrangler.tomlまたはダッシュボードで設定）

### GitHub Secretsの設定

1. リポジトリの Settings → Secrets and variables → Actions へ移動
2. 以下を追加：
   - Repository secrets:
     - `FEED_FETCH_API_KEY`: セキュアなランダム文字列を生成
   - Repository variables:
     - `PRODUCTION_URL`: 本番URL（例：https://your-app.workers.dev）

### Cloudflare環境の設定

`wrangler.toml`に追加：

```toml
[vars]
FEED_FETCH_API_KEY = "your-api-key-here"
```

または、CloudflareダッシュボードのWorker設定から設定します。

## データベースセットアップ

新しいテーブルを作成するためにマイグレーションを実行：

```bash
# ローカル開発環境
pnpm db:migrate

# 本番環境
pnpm db:migrate-production
```

## フィード取得機能のテスト

### ローカルテスト

1. 開発サーバーを起動：

   ```bash
   pnpm dev
   ```

2. フィード取得を実行：
   ```bash
   API_URL=http://localhost:5173 FEED_FETCH_API_KEY=your-test-key pnpm feed:fetch
   ```

### GitHubでの手動実行

1. Actions → Fetch RSS Feeds へ移動
2. "Run workflow" をクリック
3. ブランチを選択して実行

## モニタリング

- GitHub Actionsのログで取得結果を確認
- `feeds`テーブルの`lastErrorAt`と`lastErrorMessage`を監視
- `articles`テーブルで新規追加コンテンツを確認

## トラブルシューティング

### よくある問題

1. **401 Unauthorized**: 両環境で`FEED_FETCH_API_KEY`が一致していることを確認
2. **フィードパースエラー**: フィードURLが有効なRSS/Atomフィードであることを確認
3. **記事が表示されない**: フィードがアクティブで最近の記事を含んでいることを確認
4. **GitHub Actionが失敗する**: アップロードされたアーティファクトで詳細なログを確認

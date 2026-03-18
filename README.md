# Reflect Journal

振り返り用ジャーナルアプリです。ローカル開発に加えて、AWS 上の本番構成でも動作します。

## セットアップ

前提: Node.js

1. 依存関係をインストール
   `npm install`
2. 開発サーバーを起動
   `npm run dev`

## スクリプト

- `npm run dev`: 開発サーバー起動（`http://localhost:3000`）
- `npm run backend:dev`: backend API をローカル起動（`http://localhost:4000`）
- `npm run build`: 本番ビルド作成
- `npm run backend:build`: Lambda 用 backend bundle を作成
- `npm run preview`: ビルド結果をローカル確認
- `npm run lint`: TypeScript 型チェック

## データ永続化の構成

- UI コンポーネントは `useJournalStore` を通じてデータを扱います
- `useJournalStore` は repository 経由でデータを取得・保存します
- repository 実装は `src/repositories/` に集約されています
- デフォルトでは `localStorageRepository` が使われ、ブラウザの `localStorage` に保存します
- 将来 API / DB に移行する場合は repository 実装を差し替えることで、UI 側の変更を最小限に抑えられます

## Repository 切替

- デフォルトでは `localStorageRepository` を利用します
- `VITE_REPOSITORY_DRIVER=api` を指定すると `apiRepository` に切り替えられます
- API のベース URL は `VITE_API_BASE_URL` で設定できます

## API Contract

- 将来の backend API に向けた client contract は `src/contracts/journalApi.ts` に定義しています
- 仕様メモは `docs/api-contract.md` を参照してください

## Auth

- `VITE_REPOSITORY_DRIVER=api` のときは Cognito Hosted UI を使った認証を前提に動作します
- frontend は authorization code flow + PKCE で token を取得し、API リクエストに `Authorization: Bearer ...` を付与します
- `VITE_REPOSITORY_DRIVER=local-storage` のときはローカル保存モードとして動作します

## Backend

- `backend/` に API Gateway HTTP API + Lambda + Aurora PostgreSQL (RDS Data API) を前提にした backend 実装があります
- backend のローカル起動は `npm run backend:dev`
- 本番反映は `npm run backend:build` 後に Lambda へ zip を手動アップロードします
- エンドポイント一覧と backend 側の詳細は `backend/README.md` を参照してください

## 現在の AWS 構成

- frontend: Amplify Hosting
- auth: Cognito User Pool
- API: API Gateway HTTP API
- compute: Lambda
- DB: Aurora PostgreSQL Serverless v2
- DB access: RDS Data API + Secrets Manager

詳細な手順と運用メモ:

- `docs/aws-manual-setup.md`
- `docs/aws-migration-plan.md`

## デプロイの反映単位

- frontend は Amplify に接続済みブランチへの push で自動 build / deploy されます
- backend / API Gateway / Cognito / Aurora の変更は自動反映されません

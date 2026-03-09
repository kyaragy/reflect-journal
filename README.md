# Reflect Journal

ローカルで動作する振り返り用ジャーナルアプリです。

## セットアップ

前提: Node.js

1. 依存関係をインストール
   `npm install`
2. 開発サーバーを起動
   `npm run dev`

## スクリプト

- `npm run dev`: 開発サーバー起動（`http://localhost:3000`）
- `npm run build`: 本番ビルド作成
- `npm run preview`: ビルド結果をローカル確認
- `npm run lint`: TypeScript 型チェック

## GitHub Pages で公開

1. リポジトリを GitHub に push
2. GitHub の `Settings > Pages` で `Source: GitHub Actions` を選択
3. `main` ブランチへ push すると `.github/workflows/deploy-pages.yml` が自動実行され、Pages にデプロイされます

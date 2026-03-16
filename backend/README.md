# Backend

Lambda 向けの TypeScript backend です。実装は `API Gateway HTTP API -> Lambda -> RDS Data API -> Aurora PostgreSQL` を前提にしています。

## Entry Points

- `backend/src/functions/api/handler.ts`
  - 本番用の Lambda handler
- `backend/src/server.ts`
  - ローカル確認用の HTTP adapter

## Routes

- `GET /health`
- `GET /bootstrap`
- `GET /days/:date`
- `PUT /days/:date`
- `PUT /days/:date/summary`
- `POST /days/:date/cards`
- `PUT /days/:date/cards/:cardId`
- `DELETE /days/:date/cards/:cardId`
- `GET /weeks/:weekKey`
- `PUT /weeks/:weekKey/summary`
- `GET /months/:monthKey`
- `PUT /months/:monthKey/summary`
- `GET /years/:yearKey`
- `PUT /years/:yearKey/summary`
- `POST /migration/local-storage-import`

## Environment Variables

- `AWS_REGION`
- `DATABASE_ARN`
- `DATABASE_SECRET_ARN`
- `DATABASE_NAME`
- `CORS_ALLOW_ORIGIN`
- `PORT`

## Local Run

```bash
npm install
npm run backend:dev
```

ローカル server は `x-dev-user-id` ヘッダを指定しない場合、`local-dev-user` を JWT `sub` 相当として扱います。

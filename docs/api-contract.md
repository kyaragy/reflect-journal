# Journal API Contract

将来 `API Gateway + Lambda` などの backend API で提供することを見据えた、フロント側の契約メモです。

## Path

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

## Success Response

正常系は `{ data, meta? }` を基本形とします。

## Error Response

異常系は以下を基本形とします。

```json
{
  "error": {
    "code": "INVALID_DATE",
    "message": "Invalid date: expected YYYY-MM-DD",
    "details": {
      "date": "2026-13-40"
    }
  }
}
```

## Validation Policy

- `date`: `YYYY-MM-DD`
- `weekKey`: `YYYY-MM-DD`
- `monthKey`: `YYYY-MM`
- `yearKey`: `YYYY`
- `cardId`: 空文字不可

`weekKey` は週の開始日を表す `YYYY-MM-DD` を前提とします。

## Auth

- frontend から `userId` は送らない
- API Gateway HTTP API の JWT authorizer が事前に JWT を検証する
- Lambda は `requestContext.authorizer.jwt.claims.sub` を `user_id` として扱う

# AWS Migration Plan

Reflect Journal を段階的に AWS 構成へ移行するための方針メモです。

## 想定 AWS 構成

- Frontend: Amplify Hosting
- Auth: Cognito User Pool
- Backend: App Runner
- DB: DynamoDB

役割分担は以下です。

- Amplify Hosting はフロントの静的配信を担当
- Cognito はユーザー認証と JWT 発行を担当
- App Runner は API サーバーをホスト
- DynamoDB は Day / Week / Month データを永続化

## DynamoDB 保存設計

単一テーブルで `pk` / `sk` を使って集約する前提です。

### Day item

- `pk`: `USER#<userId>`
- `sk`: `DAY#<YYYY-MM-DD>`
- `date`
- `cards`
- `dailySummary`
- `createdAt`
- `updatedAt`

例:

```json
{
  "pk": "USER#u_123",
  "sk": "DAY#2026-03-11",
  "date": "2026-03-11",
  "cards": [],
  "dailySummary": "",
  "createdAt": "2026-03-11T00:00:00.000Z",
  "updatedAt": "2026-03-11T00:00:00.000Z"
}
```

### Week item

- `pk`: `USER#<userId>`
- `sk`: `WEEK#<weekKey>`
- `weekKey`
- `summary`
- `createdAt`
- `updatedAt`

### Month item

- `pk`: `USER#<userId>`
- `sk`: `MONTH#<monthKey>`
- `monthKey`
- `summary`
- `createdAt`
- `updatedAt`

## 認証方針

- Cognito User Pool を使う
- フロントはログイン後の JWT を API に送る
- API 側で JWT を検証する
- `userId` は JWT から解決し、データアクセスの `pk` に反映する

現時点のフロント側では `auth context` と `Authorization` ヘッダ差し込み経路までを準備済みです。  
本物の Cognito 連携は後続 Issue で差し替えます。

## 移行ステップ

1. repository 化
2. API 雛形
3. auth context
4. backend 実装
5. Cognito
6. AWS デプロイ

現状の進捗に対応させると次の通りです。

- 済: repository 化
- 済: API 雛形
- 済: auth context
- 次: backend の実データ実装
- 次: Cognito JWT 検証
- その後: AWS デプロイと本番接続

## 次に着手する人向けメモ

- frontend は `apiRepository` 切替点をすでに持っている
- backend は `/health` と将来ルートの雛形を持っている
- 先に backend 側で in-memory 実装を DynamoDB 実装へ差し替える
- Cognito 導入時は `authSession` / `AuthContext` を本物の SDK に差し替える
- public repo のまま進める間は、実際の AWS 識別子や secrets をコミットしない

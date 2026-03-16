# AWS Manual Setup Guide

このドキュメントは、`reflect-journal` を AWS 上で手動構築するための手順書です。

前提:

- AWS アカウントは作成済み
- 東京リージョン `ap-northeast-1` を使う
- IaC は使わず、AWS コンソール中心で構築する
- backend は `API Gateway HTTP API -> Lambda -> RDS Data API -> Aurora PostgreSQL Serverless v2`
- auth は `Cognito User Pool`
- frontend は `Amplify Hosting`

この手順は、AWS に不慣れな人でも再現しやすいように、できるだけ順番を崩さずに書いています。

## 0. 全体像

作るものは次の 6 つです。

1. 請求アラートと管理者以外の作業ユーザー
2. Cognito User Pool
3. Aurora PostgreSQL Serverless v2
4. Lambda
5. API Gateway HTTP API
6. Amplify Hosting

作成順は必ずこの順を推奨します。

理由:

- Cognito が先にないと JWT authorizer を設定できない
- Aurora が先にないと Lambda の環境変数を埋められない
- Lambda が先にないと API Gateway の integration を作れない
- API が先にないと frontend の接続先を確定できない

## 1. 作業前の準備

### 1-1. リージョンを固定する

AWS コンソール右上のリージョン選択で、`Asia Pacific (Tokyo) ap-northeast-1` を選びます。

以後、基本的にすべての作業を東京リージョンで行います。

### 1-2. ルートユーザーを日常利用しない

最初にやること:

- ルートユーザーに `MFA` を設定する
- 日常作業用に IAM ユーザーまたは IAM Identity Center の作業アカウントを作る

個人開発でも、普段の作業をルートユーザーで続けるのは避けたほうが安全です。

### 1-3. 予算アラートを設定する

特に Aurora は、設定を誤ると想定より課金が出やすいです。

最低限:

- 月額予算 `10 USD` か `20 USD`
- その 80% 到達時にメール通知
- 100% 到達時にメール通知

### 1-4. 命名規則を決める

手動構築では名前が重要です。

このドキュメントでは以下を例にします。

- project: `reflect-journal`
- env: `prod`
- region: `ap-northeast-1`

推奨リソース名:

- Cognito User Pool: `reflect-journal-prod-user-pool`
- Cognito App Client: `reflect-journal-prod-web-client`
- Lambda: `reflect-journal-prod-api`
- API Gateway: `reflect-journal-prod-http-api`
- Aurora Cluster: `reflect-journal-prod-aurora`
- Secret: `reflect-journal/prod/aurora`
- Amplify App: `reflect-journal`

## 2. 事前に記録する値

以下の値は、作成したら必ずメモしてください。

- AWS account ID
- region
- Cognito User Pool ID
- Cognito User Pool domain
- Cognito App Client ID
- Cognito issuer URL
- Lambda function name
- Lambda execution role ARN
- API Gateway URL
- API Gateway JWT authorizer audience
- Aurora cluster ARN
- Aurora secret ARN
- Aurora database name

おすすめ:

- 1Password
- Notion
- `docs/aws-secrets-private.md` のような未コミット個人メモ

機密情報そのものは Git に commit しません。

## 3. Cognito User Pool を作る

### 3-1. コンソールを開く

1. AWS コンソールで `Cognito` を開く
2. 左メニューで `User pools` を開く
3. `Create user pool` を押す

### 3-2. サインイン方式を決める

最初は email ベースが扱いやすいです。

設定例:

- Sign-in options: `Email`

### 3-3. サインアップ方式を制限する

今回の要件では `self sign-up` を使いません。

設定:

- Self-registration: `Disable self-registration`
- つまり管理者だけがユーザーを作成する

この設定は AWS ドキュメント上では `admin create user only` の方針に対応します。

### 3-4. セキュリティ設定

最初は過度に複雑にしなくて構いません。

推奨:

- MFA: いったん `Optional` か `Off`
- Password policy: デフォルトで可
- Account recovery: `Email only`

MFA はあとからでも有効化できます。

### 3-5. アプリケーションクライアントを作る

User Pool 作成途中、または作成後に App Client を追加します。

設定の考え方:

- client secret は browser アプリでは使いにくいので通常は作らない
- 後で frontend から使う Web クライアントを 1 つ作る

推奨:

- App type: `Single-page application`
- Client name: `reflect-journal-prod-web-client`
- Generate client secret: `Off`

### 3-6. Hosted UI 用のドメインを作る

後でログイン動作確認をしやすくするため、User Pool の domain を作ります。

1. 作成した User Pool を開く
2. `Branding` または `Domain` 関連メニューを開く
3. Cognito domain prefix を設定する

例:

- `reflect-journal-prod-kiaragi`

保存後、以下をメモします。

- User Pool ID
- App Client ID
- domain

### 3-7. issuer URL をメモする

API Gateway の JWT authorizer で必要になります。

東京リージョンなら形式は通常こうです。

```text
https://cognito-idp.ap-northeast-1.amazonaws.com/<USER_POOL_ID>
```

### 3-8. 管理者ユーザーを 1 人作る

1. User Pool を開く
2. `Users` を開く
3. `Create user` を押す
4. email を入力
5. 一時パスワードを発行する

最初のログイン確認を必ずしておきます。

## 4. Aurora PostgreSQL Serverless v2 を作る

### 4-1. RDS コンソールを開く

1. AWS コンソールで `RDS` を開く
2. `Databases` を開く
3. `Create database` を押す

### 4-2. 作成方式

設定:

- Choose a database creation method: `Standard create`
- Engine type: `Amazon Aurora`
- Edition: `Aurora PostgreSQL-Compatible Edition`

### 4-3. Serverless v2 を選ぶ

設定:

- DB cluster identifier: `reflect-journal-prod-aurora`
- Capacity type: `Serverless v2`

Aurora PostgreSQL のバージョンは、東京リージョンで `RDS Data API` 対応のものを選びます。

古すぎるバージョンは避けてください。

### 4-4. 認証情報

設定:

- Master username: 例 `reflect_admin`
- Credentials management: `Self managed` でもよいが、Secrets Manager 管理がわかりやすい

今回の構成では、Secrets Manager に保存された資格情報を Lambda から参照する前提です。

### 4-5. Data API を有効にする

作成画面または作成後の cluster 設定で、必ず `Data API` を有効にします。

ここは重要です。これを有効化しないと backend の実装がそのままでは動きません。

### 4-6. ネットワーク

最初は次の方針が無難です。

- Default VPC を使う
- Public access は `No`

Lambda から Data API を使うだけなら、Lambda を VPC に入れずに済むため、最初の構成として扱いやすいです。

### 4-7. Serverless v2 capacity

最初は小さく始めます。

例:

- Minimum ACU: `0.5`
- Maximum ACU: `1` または `2`

個人利用なら上限を大きくしすぎないほうが安全です。

### 4-8. 作成後にメモする

作成が終わったら次を控えます。

- cluster ARN
- writer endpoint
- secret ARN
- database name

## 5. DB schema を適用する

schema ファイルは [backend/schema.sql](/home/kiaragi/projects/reflect-journal/backend/schema.sql) を使います。

### 5-1. 一番簡単な考え方

AWS に不慣れなら、最初は「一時的にローカルの SQL クライアントから接続して schema を流す」のが一番わかりやすいです。

使う候補:

- `psql`
- DBeaver
- TablePlus

### 5-2. もしローカル接続する場合の考え方

一時的に以下を行います。

1. Aurora の security group に自分のグローバル IP からの 5432 を許可
2. 必要なら Public access を一時的に調整
3. schema 適用後に inbound rule を閉じる

初心者向けには GUI クライアントのほうが確認しやすいです。

### 5-3. 適用する SQL

ファイル:

- [backend/schema.sql](/home/kiaragi/projects/reflect-journal/backend/schema.sql)

適用後、次のテーブルが作られていることを確認します。

- `users`
- `journal_days`
- `journal_cards`
- `weekly_summaries`
- `monthly_summaries`
- `yearly_summaries`

## 6. Lambda を作る

### 6-1. 先にローカルで build する

リポジトリルートで:

```bash
npm install
npm run backend:build
```

出力先:

- `backend/dist/functions/api/handler.js`

### 6-2. zip を作る

例:

```bash
cd backend/dist
zip -r function.zip .
```

作成される zip を Lambda にアップロードします。

### 6-3. Lambda 関数を作る

1. AWS コンソールで `Lambda` を開く
2. `Create function`
3. `Author from scratch`

設定:

- Function name: `reflect-journal-prod-api`
- Runtime: `Node.js 20.x`
- Architecture: `x86_64` で可

### 6-4. ハンドラー設定

アップロード後、Handler を次に設定します。

```text
functions/api/handler.handler
```

理由:

- zip の中に `functions/api/handler.js` があり
- そのファイルの `export const handler` を呼び出すため

### 6-5. 環境変数を設定する

Lambda の `Configuration -> Environment variables` で以下を追加します。

- `AWS_REGION=ap-northeast-1`
- `DATABASE_ARN=<Aurora cluster ARN>`
- `DATABASE_SECRET_ARN=<Secrets Manager secret ARN>`
- `DATABASE_NAME=<database name>`
- `CORS_ALLOW_ORIGIN=<frontend domain>`

開発中は `CORS_ALLOW_ORIGIN=*` でも構いませんが、本番では Amplify の domain に絞るほうが安全です。

### 6-6. IAM 権限を付与する

Lambda execution role に次を付けます。

- CloudWatch Logs への出力権限
- `rds-data` 実行権限
- `secretsmanager:GetSecretValue`

最小限の考え方:

- 対象の Aurora cluster ARN
- 対象の Secret ARN

にだけ絞る

### 6-7. テスト実行

Lambda のコンソールで test event を作る前に、まず API Gateway 経由で確認するほうが今回の構成には合っています。

ただし、Lambda 単体で試したい場合は API Gateway event v2 形式で event を作る必要があります。

## 7. API Gateway HTTP API を作る

### 7-1. API を作る

1. AWS コンソールで `API Gateway` を開く
2. `HTTP API` を選ぶ
3. `Build`

設定:

- API name: `reflect-journal-prod-http-api`

### 7-2. Lambda integration を追加する

先ほど作成した Lambda:

- `reflect-journal-prod-api`

を integration として紐づけます。

### 7-3. JWT authorizer を作る

API Gateway の `Authorizers` で `JWT authorizer` を追加します。

必要な値:

- Issuer URL:
  `https://cognito-idp.ap-northeast-1.amazonaws.com/<USER_POOL_ID>`
- Audience:
  `<COGNITO_APP_CLIENT_ID>`

authorizer 名の例:

- `cognito-jwt`

### 7-4. route を作る

最低限必要な route:

- `GET /health`
- `GET /bootstrap`
- `GET /days/{date}`
- `PUT /days/{date}`
- `PUT /days/{date}/summary`
- `POST /days/{date}/cards`
- `PUT /days/{date}/cards/{cardId}`
- `DELETE /days/{date}/cards/{cardId}`
- `GET /weeks/{weekKey}`
- `PUT /weeks/{weekKey}/summary`
- `GET /months/{monthKey}`
- `PUT /months/{monthKey}/summary`
- `GET /years/{yearKey}`
- `PUT /years/{yearKey}/summary`
- `POST /migration/local-storage-import`

設定ルール:

- `GET /health` は authorizer なしでもよい
- それ以外は JWT authorizer を付ける

### 7-5. stage を確認する

最初は default stage で構いません。

API 作成後に発行される invoke URL をメモします。

例:

```text
https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com
```

## 8. API の疎通確認

### 8-1. まず health を確認する

ブラウザまたは curl で:

```bash
curl https://<API_ID>.execute-api.ap-northeast-1.amazonaws.com/health
```

期待値:

- 200
- `{ "data": { "status": "ok", "service": "reflect-journal-backend" } }`

### 8-2. 認証付き API を確認する

次は Cognito でログインし、access token を使って `/bootstrap` を呼びます。

access token が取得できたら:

```bash
curl \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  https://<API_ID>.execute-api.ap-northeast-1.amazonaws.com/bootstrap
```

期待値:

- 200
- `{ data: { days: [], weeklySummaries: [], monthlySummaries: [], yearlySummaries: [] } }`

### 8-3. エラーが出たときの見る場所

順番:

1. API Gateway の route 設定
2. JWT authorizer の issuer / audience
3. Lambda の CloudWatch Logs
4. Lambda 環境変数
5. Aurora ARN / Secret ARN
6. Data API が有効か

## 9. Amplify Hosting を作る

### 9-1. GitHub 連携

1. AWS コンソールで `Amplify` を開く
2. `New app`
3. `Host web app`
4. GitHub repository を接続

### 9-2. build 設定

frontend は Vite なので、通常は Amplify が自動検出できます。

必要なら build settings で以下に近い設定にします。

- install: `npm ci`
- build: `npm run build`
- artifact: `dist`

### 9-3. frontend の環境変数

Amplify 側で最低限必要になる値:

- `VITE_API_BASE_URL=<API Gateway invoke URL>`
- `VITE_REPOSITORY_DRIVER=api`

Cognito 実装を frontend に追加したあとには、さらに以下も必要になります。

- `VITE_COGNITO_REGION`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_APP_CLIENT_ID`
- `VITE_COGNITO_DOMAIN`

## 10. frontend の Cognito 連携

注意:

2026-03-16 時点のこのリポジトリでは、frontend の auth はまだ mock 実装です。

対象ファイル:

- [src/auth/AuthContext.tsx](/home/kiaragi/projects/reflect-journal/src/auth/AuthContext.tsx)
- [src/auth/authSession.ts](/home/kiaragi/projects/reflect-journal/src/auth/authSession.ts)

AWS 側を先に作っても、frontend に本物の Cognito ログインを実装しない限り、ブラウザから本番 API を正しく叩けません。

つまり AWS 側の作成と並行して、frontend の Cognito 対応が別途必要です。

## 11. 作成後チェックリスト

全部終わったら、次を確認します。

- `GET /health` が 200
- access token 付き `GET /bootstrap` が 200
- card 作成 API が 200
- day summary 更新 API が 200
- year summary 更新 API が 200
- Aurora にデータが実際に入る
- CloudWatch Logs に致命的エラーが出ていない
- Amplify の frontend から API に接続できる

## 12. よくある詰まりどころ

### 12-1. `/health` は通るが `/bootstrap` が 401

見る場所:

- API Gateway JWT authorizer の issuer
- API Gateway JWT authorizer の audience
- 送っている token が `id token` ではなく `access token` か

### 12-2. Lambda が DB に繋がらない

見る場所:

- `DATABASE_ARN`
- `DATABASE_SECRET_ARN`
- `DATABASE_NAME`
- Data API 有効化
- Lambda role の `rds-data` 権限
- Lambda role の `secretsmanager:GetSecretValue`

### 12-3. CORS エラーが出る

見る場所:

- Lambda の `CORS_ALLOW_ORIGIN`
- API Gateway 経由で返っているレスポンスヘッダ
- frontend の domain が変わっていないか

### 12-4. schema 適用後にテーブルが見えない

見る場所:

- 接続先 DB 名
- 適用先 cluster
- 適用した schema が本当に [backend/schema.sql](/home/kiaragi/projects/reflect-journal/backend/schema.sql) か

## 13. この順番で進める

迷ったら、次の順で進めてください。

1. Cognito User Pool
2. テストユーザー作成
3. Aurora PostgreSQL Serverless v2
4. Data API 有効化
5. schema 適用
6. Lambda
7. API Gateway HTTP API
8. `/health` 確認
9. `/bootstrap` 確認
10. Amplify Hosting
11. frontend の Cognito 対応

## 参考リンク

- Cognito user pool の admin create user only:
  https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-admin-create-user-policy.html
- AdminCreateUser API:
  https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminCreateUser.html
- API Gateway HTTP API JWT authorizer:
  https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html
- Aurora Data API の有効化:
  https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.enabling.html
- Aurora Data API の制約:
  https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.limitations.html
- Data API の対応リージョン:
  https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.Aurora_Fea_Regions_DB-eng.Feature.Data_API.html

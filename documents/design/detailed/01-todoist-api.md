# Todoist API 連携設計

## What is this?

Rust バックエンドから Todoist API を呼び出す際の仕様を定義するドキュメントです。
タスク取得（REST API v1）とタスク完了（Sync API v9）の2つのエンドポイントについて、リクエスト・レスポンス仕様・認証・エラーハンドリングを記載します。

## 使用 API

### 1. タスク取得 API（REST API v1）

**エンドポイント**
```
GET https://api.todoist.com/api/v1/tasks
```

**リクエストヘッダー**
```
Authorization: Bearer {TODOIST_TOKEN}
```

**クエリパラメータ**
| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `filter` | `p1` | P1 タスクのみ取得 |
| `cursor` | `{cursor}` | ページネーション用（省略可） |

**レスポンス形式**

配列形式とページネーション形式の両方に対応する。

```json
// 配列形式
[{ "id": "...", "content": "...", "priority": 4, "due": { "date": "2026-03-12" }, "url": "..." }]

// ページネーション形式
{
  "results": [ ... ],
  "next_cursor": "abc123"  // null の場合は最終ページ
}
```

**ページネーション処理**

`next_cursor` が存在する限りリクエストを繰り返し、全件取得する。

**クライアント側フィルタリング**

API の `filter=p1` は期限切れタスクも含むため、取得後に以下の条件で絞り込む。

```
priority == 4 (P1)
AND due.date の先頭 10 文字 == 今日の日付 (YYYY-MM-DD)
```

---

### 2. タスク完了 API（Sync API v9）

**エンドポイント**
```
POST https://api.todoist.com/sync/v9/sync
```

**リクエストヘッダー**
```
Authorization: Bearer {TODOIST_TOKEN}
Content-Type: application/json
```

**リクエストボディ**
```json
{
  "commands": [
    {
      "type": "item_close",
      "uuid": "{unix_millis}-{task_id}",
      "args": { "id": "{task_id}" }
    }
  ]
}
```

- `uuid` は冪等性確保のため `{タイムスタンプms}-{task_id}` で生成する
- `item_close` は「今回分のみ完了」を意味し、繰り返しタスクの場合は次回分が自動スケジュールされる

**レスポンス**
```json
{
  "sync_status": {
    "{uuid}": "ok"
  }
}
```

**成功判定**: HTTP 2xx かつ `sync_status[uuid] == "ok"`

---

## 認証

- API Token は `.env` ファイルの `TODOIST_TOKEN` に設定する
- アプリ起動時に `dotenvy` で読み込み、環境変数として保持する
- Token は Rust バックエンドのみが参照し、フロントエンドには渡さない

---

## エラーハンドリング

| 状況 | 処理 |
|------|------|
| HTTP 4xx / 5xx | エラーメッセージを返し UI に表示する |
| `sync_status` が `"ok"` 以外 | エラーとして扱い UI に表示する |
| 環境変数未設定 | エラーメッセージを返す |

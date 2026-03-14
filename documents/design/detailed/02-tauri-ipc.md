# Tauri IPC コマンド設計

## What is this?

React フロントエンドと Rust バックエンド間の IPC 通信仕様を定義するドキュメントです。
`invoke` で呼び出せる全コマンドについて、引数・戻り値・処理フロー・エラーハンドリング方針を記載します。

## 概要

フロントエンド（React）とバックエンド（Rust）は Tauri の IPC 機構を通じて通信する。
フロントエンドは `invoke(commandName, args)` を呼び出し、Rust 側の `#[tauri::command]` 関数が処理する。

---

## コマンド一覧

### get_tasks

P1 タスクの一覧を取得する。

**フロントエンド呼び出し**
```typescript
invoke<Task[]>("get_tasks")
```

**Rust シグネチャ**
```rust
async fn get_tasks() -> Result<Vec<Task>, String>
```

**処理フロー**
1. `todoist::fetch_p1_tasks()` を呼び出す
2. 成功時: `Task[]` を返す
3. 失敗時: エラーメッセージ文字列を返す

---

### complete_task

指定したタスクを完了状態にする。

**フロントエンド呼び出し**
```typescript
invoke("complete_task", { taskId: string })
```

**Rust シグネチャ**
```rust
async fn complete_task(task_id: String) -> Result<(), String>
```

**処理フロー**
1. `todoist::close_task(task_id)` を呼び出す
2. 成功時: `()` を返す
3. 失敗時: エラーメッセージ文字列を返す

---

### open_url

指定した URL をデフォルトブラウザで開く。

**フロントエンド呼び出し**
```typescript
invoke("open_url", { url: string })
```

**Rust シグネチャ**
```rust
async fn open_url(url: String) -> Result<(), String>
```

**処理フロー**
1. macOS の `open` コマンドを `std::process::Command` で実行する
2. 成功時: `()` を返す
3. 失敗時: エラーメッセージ文字列を返す

> macOS 専用（`#[cfg(target_os = "macos")]`）

---

## エラーハンドリング方針

- Rust 側のエラーはすべて `String` に変換して返す
- フロントエンドは `invoke` の例外を `catch` し、`error` 状態にセットして UI に表示する

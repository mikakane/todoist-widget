# 状態管理設計（useTasks フック）

## What is this?

`useTasks` カスタムフックの詳細設計ドキュメントです。
タスクの取得・完了・自動更新に関わる状態・定数・関数・ライフサイクル・戻り値を記載します。
スコープは `src/hooks/useTasks.ts` に限定します。

## 概要

**ファイル**: `src/hooks/useTasks.ts`

タスクの取得・完了・自動更新に関わる状態とロジックをカプセル化したカスタムフック。

---

## 定数

| 定数 | 値 | 説明 |
|-----|-----|------|
| `DISPLAY_LIMIT` | `3` | UI に表示するタスクの最大件数 |
| `REFRESH_INTERVAL_MS` | `30_000` | 自動更新の間隔（ミリ秒） |

---

## 状態一覧

| 状態 | 型 | 初期値 | 説明 |
|-----|-----|--------|------|
| `allTasks` | `Task[]` | `[]` | 取得した全 P1 タスク |
| `loading` | `boolean` | `true` | 初回ロード中フラグ |
| `refreshing` | `boolean` | `false` | 手動・自動更新中フラグ |
| `error` | `string \| null` | `null` | エラーメッセージ |
| `lastUpdated` | `Date \| null` | `null` | 最終更新日時 |

---

## 関数一覧

### fetchTasks

タスクを取得して状態を更新する。

```
invoke("get_tasks")
  → allTasks を更新
  → error をクリア
  → lastUpdated を現在時刻に更新
  → loading / refreshing を false に戻す
※ 失敗時: error にメッセージをセット
```

### refresh

手動更新のエントリーポイント。

```
refreshing を true にセット
→ fetchTasks() を実行
```

### closeTask

タスクを完了にしてリストを再取得する。

```
invoke("complete_task", { taskId })
→ 成功時: fetchTasks() を実行してリストを更新
```

---

## ライフサイクル

```
マウント時
  → loading = true
  → fetchTasks() 実行

マウント後
  → setInterval(fetchTasks, 30_000) で定期更新開始

アンマウント時
  → clearInterval() でタイマーを解除
```

---

## 戻り値

```typescript
{
  tasks: allTasks.slice(0, DISPLAY_LIMIT),  // 表示用（最大3件）
  total: allTasks.length,                    // 全件数（フッター表示用）
  loading,
  refreshing,
  error,
  lastUpdated,
  closeTask,
  refresh,
}
```

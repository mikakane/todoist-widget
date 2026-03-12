# Todoist Focus Widget (Mac) 設計書

## 1. 概要

Mac デスクトップ右上に常時表示される小型ウィジェットアプリを作成する。
表示内容は Todoist の「今日の P1 タスク」最大3件。
ユーザーがタスクをクリックすると Todoist 側のタスクを完了状態に更新する。
本アプリの目的は **作業集中の維持** である。

---

## 2. 使用技術

### フレームワーク

| 技術 | 用途 |
|------|------|
| Tauri v2 | デスクトップアプリフレームワーク |
| Rust | バックエンド・API通信 |
| TypeScript | フロントエンド型安全 |
| React | 軽量 UI |

### Tauri を使用する理由

- Electron より軽量
- メモリ消費が小さい
- 常駐アプリ向き

---

## 3. 外部サービス

### Todoist API

| 項目 | 値 |
|------|---|
| API | https://developer.todoist.com/rest/v2/ |
| 認証 | `Authorization: Bearer <API_TOKEN>` |
| 取得対象 | `GET /tasks?filter=today & p1` |

### 優先度定義

| priority | 意味 |
|----------|------|
| 4 | P1 |
| 3 | P2 |
| 2 | P3 |
| 1 | P4 |

---

## 4. 機能要件

### 4.1 タスク表示

**表示対象**

- 今日
- priority = 4
- 最大3件

**例**

```
🔥 TODAY P1
☐ AWS billing export
☐ 提案資料レビュー
☐ Slack通知設定
```

### 4.2 タスク完了

ユーザーがチェックボックスをクリックした場合:

```
POST /tasks/{task_id}/close
```

処理成功後:
- UI からタスク削除
- 最新タスク再取得

### 4.3 自動更新

**更新間隔:** 30秒

```
fetch tasks
  ↓ priority=4
  ↓ today filter
  ↓ 最大3件
```

### 4.4 常時表示

**ウィンドウ仕様**

- Always on top
- フレームなし
- 透明背景
- リサイズ不可

---

## 5. UI 仕様

### サイズ

```
width: 260px
height: auto
```

### レイアウト

```
┌──────────────────────────┐
│ 🔥 TODAY P1              │
│──────────────────────────│
│ ☐ Task 1                 │
│ ☐ Task 2                 │
│ ☐ Task 3                 │
│                          │
│ updated 21:10           │
└──────────────────────────┘
```

### デザイン

| 項目 | 値 |
|------|---|
| 背景 | `rgba(0,0,0,0.8)` |
| 文字色 | `white` |
| フォントサイズ | `14px` |
| フォント | `system-ui` |
| Hover | `background: rgba(255,255,255,0.05)` |

---

## 6. ウィンドウ配置

**Mac 右上**

```
x = screenWidth - 280
y = 20
```

---

## 7. アーキテクチャ

```
┌───────────────┐
│   React UI    │
└───────┬───────┘
        │
        │ invoke
        ↓
┌───────────────┐
│   Tauri Rust  │
└───────┬───────┘
        │
        │ HTTP
        ↓
┌───────────────┐
│  Todoist API  │
└───────────────┘
```

---

## 8. Rust 側実装

### task 取得

```
GET https://api.todoist.com/rest/v2/tasks
```

フィルタ:
- `priority == 4`
- `due.date == today`

### task 完了

```
POST https://api.todoist.com/rest/v2/tasks/{id}/close
```

---

## 9. フロントエンド構成

```
src/
├ components
│   └ TaskItem.tsx
│
├ hooks
│   └ useTasks.ts
│
├ App.tsx
└ main.tsx
```

---

## 10. 状態管理

React state:

```ts
tasks: Task[]
loading: boolean
lastUpdated: Date
```

---

## 11. Task 型

```ts
interface Task {
  id: string
  content: string
  priority: number
  due?: {
    date: string
  }
}
```

---

## 12. 更新フロー

```
App start
   ↓
fetch tasks
   ↓
UI render
   ↓
30秒 interval
   ↓
fetch tasks
```

---

## 13. 完了フロー

```
checkbox click
   ↓
invoke(closeTask)
   ↓
Rust API call
   ↓
success
   ↓
refresh tasks
```

---

## 14. セキュリティ

### API トークン

| 項目 | 値 |
|------|---|
| 保存方法 | `.env` |
| 例 | `TODOIST_TOKEN=xxxxx` |

---

## 15. 将来拡張

- Pomodoro タイマー
- 今日タスク表示
- priority 切替
- ドラッグ移動
- ショートカットキー

---

## 16. MVP 完成条件

以下が満たされれば MVP 完成:

- [ ] Todoist 連携
- [ ] P1 タスク最大3件表示
- [ ] 完了同期
- [ ] 30秒更新
- [ ] 右上常時表示

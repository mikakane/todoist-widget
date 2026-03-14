# コンポーネント詳細設計

## What is this?

React コンポーネントの詳細設計ドキュメントです。
`App` および `TaskItem` について、役割・Props・内部状態・主要処理・レンダリング構造を記載します。

## コンポーネント一覧

```
App
└── TaskItem（0〜3件）
```

---

## App

**ファイル**: `src/App.tsx`

### 役割

- アプリ全体のレイアウトとウィンドウ制御を担う
- `useTasks` フックでタスク状態を管理し、子コンポーネントに渡す

### Props

なし（ルートコンポーネント）

### 内部状態

なし（状態は useTasks フックに委譲）

### 主要処理

**ウィンドウ自動リサイズ**
- `ResizeObserver` でコンテンツ要素の高さを監視する
- 高さ変化時に `getCurrentWindow().setSize(new LogicalSize(260, h))` を呼び出す
- `requestAnimationFrame` でリサイズ処理をバッチ化する

**スクロール禁止**
- `wheel` イベントを `preventDefault()` で無効化する

### レンダリング構造

```
<div class="widget">
  <div class="header" data-tauri-drag-region>
    <span class="title">🔥 TODAY P1</span>
    <div class="actions">
      <button class="action-btn" onClick={refresh}>↻</button>
      <button class="action-btn" onClick={hide}>✕</button>
    </div>
  </div>

  <hr class="divider" />

  {/* ローディング中 */}
  {loading && <div class="loading">...</div>}

  {/* エラー */}
  {error && <div class="error">{error}</div>}

  {/* タスク一覧 */}
  {tasks.map(task => <TaskItem task={task} onClose={closeTask} />)}

  {/* タスクなし */}
  {!loading && tasks.length === 0 && <div class="empty">No P1 tasks</div>}

  <div class="footer" data-tauri-drag-region>
    <span class="total">🔥 {total}</span>
    <span class="updated">updated {HH:MM}</span>
  </div>
</div>
```

---

## TaskItem

**ファイル**: `src/components/TaskItem.tsx`

### 役割

タスク 1 件の表示と操作（完了・URL 開く）を担う。

### Props

```typescript
interface Props {
  task: Task;
  onClose: (id: string) => Promise<void>;
}
```

### 内部状態

| 状態 | 型 | 初期値 | 説明 |
|-----|-----|--------|------|
| `closing` | `boolean` | `false` | 完了処理中フラグ |

### 主要処理

**タスク完了**
1. `closing` を `true` にして UI をグレーアウト（opacity 0.4）
2. `onClose(task.id)` を呼び出す
3. 完了後は親コンポーネントがリスト更新を行う

**URL を開く**
- `task.url` が存在する場合はそれを使用する
- 存在しない場合は `https://app.todoist.com/app/task/${task.id}` を使用する
- `invoke("open_url", { url })` でブラウザを起動する

### レンダリング構造

```
<div class="task-item" style={{ opacity: closing ? 0.4 : 1 }}>
  <button class="checkbox" onClick={handleClose}>☐</button>
  <span class="content" onClick={handleOpenUrl}>{task.content}</span>
</div>
```

# Todoist Focus Widget 設計書

## What is this?

Todoist Focus Widget 全体の設計概要をまとめたドキュメントです。
アプリの目的・技術スタック・ディレクトリ構成・アーキテクチャの概要を記載します。
各機能の詳細は詳細設計ドキュメントを参照してください。

## 概要

macOS デスクトップ右上に常時表示される、Todoist P1（最優先）タスクのフォーカスウィジェット。
React + Tauri (Rust) のハイブリッドアーキテクチャによるデスクトップアプリ。

---

## 技術スタック

| 層 | 技術 |
|----|------|
| フロントエンド | React 18, TypeScript 5, Vite 5 |
| バックエンド | Rust, Tauri 2, Tokio |
| HTTP クライアント | reqwest 0.12 |
| macOS 統合 | Objective-C (objc クレート) |

---

## ディレクトリ構成

```
todoist-focus-widget/
├── src/                    # React フロントエンド
│   ├── components/
│   │   └── TaskItem.tsx   # タスク 1 件のコンポーネント
│   ├── hooks/
│   │   └── useTasks.ts    # タスク取得・完了・更新ロジック
│   ├── App.tsx             # ルートコンポーネント・ウィンドウ制御
│   ├── App.css             # ウィジェット UI スタイル
│   └── index.css           # グローバルスタイル・透明背景設定
├── src-tauri/              # Rust バックエンド
│   ├── src/
│   │   ├── lib.rs          # Tauri コマンド定義・ウィンドウ初期化
│   │   ├── main.rs         # エントリーポイント
│   │   └── todoist.rs      # Todoist API クライアント
│   └── tauri.conf.json     # ウィンドウ設定
└── .env                    # TODOIST_TOKEN
```

---

## アーキテクチャ

```
React フロントエンド
  └── Tauri IPC (invoke)
        └── Rust バックエンド
              └── Todoist API (HTTP)
```

詳細は [詳細設計](detailed/README.md) を参照。

| 詳細設計 | 内容 |
|---------|------|
| [01-todoist-api.md](detailed/01-todoist-api.md) | Todoist API 連携設計 |
| [02-tauri-ipc.md](detailed/02-tauri-ipc.md) | Tauri IPC コマンド設計 |
| [03-components.md](detailed/03-components.md) | コンポーネント詳細設計 |
| [04-state-management.md](detailed/04-state-management.md) | 状態管理設計（useTasks フック） |
| [05-window-management.md](detailed/05-window-management.md) | ウィンドウ管理設計 |

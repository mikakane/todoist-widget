# Todoist Focus Widget

Mac デスクトップ右上に常時表示される Todoist P1 タスクウィジェット。

## 必要なもの

- [Rust](https://www.rust-lang.org/tools/install) (rustup でインストール)
- Node.js 18+
- macOS

## セットアップ

### 1. Rust のインストール

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. API トークンの設定

```bash
cp .env.example .env
# .env を編集して VITE_TODOIST_TOKEN を設定
```

Todoist API トークンは https://app.todoist.com/app/settings/integrations/developer で取得。

### 4. 開発サーバー起動

```bash
npm run tauri dev
```

### 5. ビルド

```bash
npm run tauri build
```

## プロジェクト構成

```
todoist-focus-widget/
├── src/                        # React フロントエンド
│   ├── components/
│   │   └── TaskItem.tsx        # タスク1件のUI
│   ├── hooks/
│   │   └── useTasks.ts         # タスク取得・完了ロジック
│   ├── App.tsx                 # メインコンポーネント
│   ├── App.css                 # ウィジェットスタイル
│   ├── main.tsx                # エントリポイント
│   └── index.css               # グローバルスタイル
├── src-tauri/                  # Rust バックエンド
│   ├── src/
│   │   ├── lib.rs              # Tauri コマンド・ウィンドウ配置
│   │   ├── main.rs             # エントリポイント
│   │   └── todoist.rs          # Todoist API クライアント
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json         # Tauri ウィンドウ設定
├── .env.example
├── DESIGN.md
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## ウィンドウ仕様

- 常に最前面 (Always on top)
- フレームなし・透明背景
- リサイズ不可
- Mac 右上 (screenWidth - 280, y=20) に自動配置
- 30秒ごとに自動更新

## CI/CD

GitHub Actions で自動ビルド・リリースを実行。

### トリガー

| イベント | ビルド | Artifacts | Release |
|---------|--------|-----------|---------|
| main push | ✅ | ✅ | - |
| `v*.*.*` タグ push | ✅ | ✅ | ✅ |

### 開発版 dmg のダウンロード

1. [Actions](../../actions) タブを開く
2. 左サイドバーから **Release** ワークフローを選択
3. 最新の main ブランチ実行（緑チェック）をクリック
4. ページ下部の **Artifacts** セクションで `todoist-focus-widget-dmg` をクリック
5. zip を解凍して dmg を取得

※ Artifacts の保持期間は 90 日間

### リリース

```bash
git tag v0.1.0
git push origin v0.1.0
```

タグ push で自動的に GitHub Releases に dmg がアップロードされる。

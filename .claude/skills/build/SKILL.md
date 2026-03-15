---
name: build
description: Tauri アプリをローカルでビルドし、成果物をプロジェクトルートの dist/ にコピーする
disable-model-invocation: true
---

# ローカルビルド

以下のステップを順番に実行する。

## Step 1: 依存関係のインストール

```bash
cd todoist-focus-widget && npm ci
```

## Step 2: Tauri ビルド

```bash
cd todoist-focus-widget && npm run tauri build
```

## Step 3: 成果物をプロジェクトルートの dist/ にコピー

ビルド完了後、`todoist-focus-widget/src-tauri/target/release/bundle/` 配下の成果物をプロジェクトルートの `dist/` にコピーする。

```bash
rm -rf ../dist && mkdir -p ../dist
cp -r todoist-focus-widget/src-tauri/target/release/bundle/* dist/
```

コピー後、`dist/` に含まれるファイルを列挙してユーザーに報告する。

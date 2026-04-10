---
name: build
description: Tauri アプリ（todoist-focus-widget）を universal-apple-darwin ターゲットでローカルビルドし、.dmg をプロジェクトルートに配置する
---

# ローカルビルドコマンド

以下のステップを順番に実行する。

## Step 1: 依存パッケージのインストール

```bash
cd todoist-focus-widget && npm install
```

インストールに失敗した場合はエラー内容を表示して終了する。

## Step 2: Tauri アプリのビルド

```bash
cd todoist-focus-widget && npm run tauri build -- --target universal-apple-darwin
```

ビルドに失敗した場合はエラー内容を表示して終了する。

## Step 3: .dmg をプロジェクトルートにコピー

ビルド成功後、以下のディレクトリから `.dmg` ファイルを探してプロジェクトルートにコピーする。

```bash
DMG_SRC=$(ls todoist-focus-widget/src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg 2>/dev/null | head -1)
if [ -z "$DMG_SRC" ]; then
  echo "Error: .dmg ファイルが見つかりませんでした"
  exit 1
fi
cp "$DMG_SRC" .
DMG_DEST="./$(basename "$DMG_SRC")"
echo "コピー完了: $DMG_DEST"
```

## Step 4: .gitignore に *.dmg を追記

プロジェクトルートの `.gitignore` に `*.dmg` がなければ追記する。

```bash
if ! grep -qx '\*.dmg' .gitignore; then
  echo '*.dmg' >> .gitignore
  echo ".gitignore に *.dmg を追記しました"
fi
```

## Step 5: 成果物パスの表示

コピーした `.dmg` ファイルの絶対パスを表示する。

```bash
echo "ビルド成功: $(realpath "$DMG_DEST")"
```

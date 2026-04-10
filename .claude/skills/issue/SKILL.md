---
name: issue
description: GitHub Issue を起点に、計画・実装・PR作成を行う Issue-driven 開発ワークフロー
disable-model-invocation: true
argument-hint: "[issue-number]"
---

# Issue-driven 開発コマンド

Issue番号 `$ARGUMENTS` を受け取り、以下のステップを順番に実行する。

## ルール

- Issue本文の更新は `gh issue edit` で**上書き**する（コメントは使わない）
- 実行計画の承認を得てから実装を開始する。承認前にコードを変更しない
- 承認後は実行計画に忠実に実装する。計画外の変更は行わない
- ブランチ名: `fix/issue-{番号}-{概要}` または `feat/issue-{番号}-{概要}`
- コミットメッセージ: `{type}({scope}): {概要} (#{番号})`
- PRのbodyには必ず `Closes #{番号}` を含める

### Issue本文の記法

テーブルは使わず、箇条書きで記述する。

**タスク系の項目はすべてチェックボックス付きリスト（`- [ ]`）で記述する。**
実装完了時にチェックを付けて（`- [x]`）Issue本文を更新する。
対象セクション: Requirements、テストケース、修正が必要なドキュメント

変更種別は以下の記号で明示する。
- `U` (Added)   : 新規作成するファイル
- `M` (Modified): 既存ファイルを修正
- `D` (Deleted) : 削除するファイル

GitHubリンクは `gh repo view --json nameWithOwner` で取得したリポジトリ情報をもとに
`https://github.com/{owner}/{repo}/blob/main/{path}` の形式で生成する。
`U`（新規作成）のファイルはまだ存在しないためリンクなしでパスのみ記載する。

---

## Step 1: Issue 取得

`mcp__github__issue_read` ツールで Issue の本文・ラベル・担当者を取得する。
続けて `get_comments` メソッドでコメント一覧も取得し、内容を把握する。

取得後、**承認判定**を行う（詳細は Step 5 参照）。

---

## Step 2: リポジトリ情報の取得

```bash
# オーナー・リポジトリ名を取得してGitHubリンク生成に使用する
gh repo view --json nameWithOwner --jq '.nameWithOwner'
# 例: "owner/repo" → https://github.com/owner/repo/blob/main/{path}
```

---

## Step 3: コードベースの調査

Issueの内容をもとに、関連するファイル・モジュール・テストを調査する。

- 変更が必要なファイルを特定し、変更種別（U / M / D）を判断する
  - `U` (Added)   : 新規作成するファイル
  - `M` (Modified): 既存ファイルを修正
  - `D` (Deleted) : 削除するファイル
- 既存のテストコードの場所・構成を確認する
- ドキュメント（README、docs/ など）の該当箇所を確認する

---

## Step 4: Issue 本文を実行計画で更新

以下のフォーマットで Issue 本文を**上書き更新**する。

```bash
gh issue edit $ARGUMENTS --body "<以下のフォーマットで生成した本文>"
```

### Issue 本文フォーマット

GitHubリンクは `https://github.com/{owner}/{repo}/blob/main/{path}` の形式で生成する。
ファイルが未作成（U）の場合はリンクなしでパスのみ記載する。

```markdown
## 概要

<!-- Issueの目的・背景・解決したい問題を簡潔に記述 -->

## Requirements

<!-- 満たすべき要件を箇条書きで記述 -->

- [ ] 要件1
- [ ] 要件2

## 実装機能

<!-- ユーザー・システム視点での機能仕様を記述 -->

- **機能A**: 説明
- **機能B**: 説明

## 実装詳細

<!-- PR の Diff と対応する、ファイル単位の変更内容を記述 -->
<!-- 変更種別: U = Added / M = Modified / D = Deleted -->

- `M` [src/foo/bar.ts](https://github.com/{owner}/{repo}/blob/main/src/foo/bar.ts)
  - `functionA(x: string)`: ○○のロジックを修正
  - `ClassB.methodC()`: △△に対応するため引数を追加
- `U` `src/foo/new.ts`
  - `NewClass`: ○○を担当する新規クラスを作成
  - `helperFn()`: △△のユーティリティ関数を追加
- `D` [src/foo/old.ts](https://github.com/{owner}/{repo}/blob/main/src/foo/old.ts)
  - `OldClass` および関連する export をすべて削除

## テストケース

<!-- 変更種別: U = Added / M = Modified / D = Deleted -->

- `M` [src/foo/bar.test.ts](https://github.com/{owner}/{repo}/blob/main/src/foo/bar.test.ts)
  - [ ] 正常系: ○○のとき△△になること
  - [ ] 異常系: ○○のとき□□エラーになること
- `U` `src/foo/new.test.ts`
  - [ ] 正常系: NewClass が○○を返すこと

## 修正が必要なドキュメント

<!-- 変更種別: U = Added / M = Modified / D = Deleted -->
<!-- チェックボックス付きで記述し、完了時にチェックを付ける -->

- [ ] `M` [README.md](https://github.com/{owner}/{repo}/blob/main/README.md): ○○のセットアップ手順を追記
- [ ] `M` [docs/api.md](https://github.com/{owner}/{repo}/blob/main/docs/api.md): ○○エンドポイントの仕様を更新
```

---

## Step 5: 承認確認

実行計画を提示した後、以下の順で承認を確認する。

### 自動承認（コメント判定）

Step 1 で取得したコメント一覧を確認し、以下の条件を**すべて満たす**コメントが存在する場合は自動的に Step 6 へ進む。

- コメント本文をトリム（前後の空白・改行を除去）した結果が、`承認` または `approve` と**完全一致**すること
- 部分一致（例: 「承認します」「please approve」など）は対象外

### 手動承認（チャット）

自動承認コメントが存在しない場合は、ユーザーからのチャットでの承認を待つ。

- 「承認」「LGTM」「ok」「proceed」「進めて」などで実装に進む
- 修正指示があれば Step 3 に戻り本文を再更新する

---

## Step 6: ブランチ作成・チェックアウト

```bash
# ラベルに応じてプレフィックスを使い分ける
# bug系:     fix/issue-{番号}-{概要}
# feature系: feat/issue-{番号}-{概要}
git checkout -b fix/issue-$ARGUMENTS-{概要}
```

---

## Step 7: 実装

- Step 3の実装詳細に従ってコードを変更する
- テストケースに従ってテストを追加・修正する
- ドキュメント一覧に従ってドキュメントを更新する
- 完了した項目のチェックボックスにチェックを付けて Issue 本文を更新する

---

## Step 8: PR 作成

確認なしで即座に PR を作成する。

```bash
gh pr create \
  --title "{type}: {タイトル} (#$ARGUMENTS)" \
  --body "$(cat <<'EOF'
## 概要

Closes #$ARGUMENTS

## 変更内容

<!-- 実装詳細の内容をサマリーとして記述 -->

## テスト

<!-- テストの実行方法・確認事項 -->

## レビュー観点

<!-- レビュアーに特に見てほしい箇所 -->
EOF
)"
```

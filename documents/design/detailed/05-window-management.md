# ウィンドウ管理設計

## What is this?

Tauri ウィンドウの管理仕様を定義するドキュメントです。
ウィンドウサイズ・位置・透明化・動的リサイズ・表示/非表示制御・ドラッグ移動・トレイアイコン操作について記載します。
スコープは `src-tauri/src/lib.rs` および `tauri.conf.json` の設定に限定します。

## ウィンドウ仕様

| 項目 | 値 |
|-----|-----|
| 幅 | 260px（固定） |
| 高さ | コンテンツに応じて動的変化（最小 60px） |
| リサイズ | 不可 |
| フレーム | なし（decorations: false） |
| 透明 | あり（transparent: true） |
| 常に最前面 | あり（alwaysOnTop: true） |
| Dock 表示 | なし（skipTaskbar: true） |
| 起動位置 | 画面右上（x: 画面幅 - 280, y: 40） |

---

## 初期位置の算出

```rust
let monitor = window.current_monitor()?.unwrap();
let scale = monitor.scale_factor();
let screen_w = monitor.size().width as f64 / scale;  // 論理ピクセル換算

window.set_position(LogicalPosition::new(screen_w - 280.0, 40.0))
```

---

## 動的リサイズ

コンテンツ（タスク件数）に応じてウィンドウ高さを自動調整する。

**フロントエンド（App.tsx）**

```
ResizeObserver でコンテンツ要素の高さを監視
→ 高さ変化を検知
→ requestAnimationFrame でバッチ化
→ getCurrentWindow().setSize(new LogicalSize(260, contentHeight))
```

---

## 透明化の実装

macOS で完全透過を実現するには以下の全項目が必要。

### tauri.conf.json

```json
{
  "transparent": true,
  "decorations": false,
  "shadow": false,
  "backgroundColor": [0, 0, 0, 0]
}
```

- `shadow: false` が必須。shadow が有効だと compositor が四隅に白を描画する。
- `macOSPrivateApi: true` を有効にすると wry が WKWebView の `drawsBackground=false` を設定レベルで永続的に適用する。

### Rust（lib.rs）

```rust
// setup 内で明示的にも無効化する（設定の二重防衛）
let _ = window.set_shadow(false);
```

### CSS（index.css）

```css
html {
  background: transparent !important;
}
body {
  background: transparent !important;
  /* native corner radius を使わず CSS 側で角丸を作る */
  border-radius: 10px;
  overflow: hidden;
}
```

- `border-radius` は `html` ではなく `body` に指定する。`html` に指定すると macOS compositor が透過合成時に白を塗ることがある。
- `!important` で他スタイルからの上書きを防ぐ。

---

## ウィンドウ表示・非表示

| 操作 | 処理 |
|------|------|
| 閉じるボタン（UI） | `getCurrentWindow().hide()` |
| ウィンドウ閉じるイベント | `prevent_close()` → `window.hide()` |
| トレイメニュー「表示/非表示」 | `is_visible()` で判定し `hide()` / 再表示フロー をトグル |

アプリはウィンドウを閉じても終了しない。終了はトレイメニューの Quit のみ。

### トレイからの再表示（透過維持のための必須フロー）

macOS では `hide()` → `show()` のフローを通ると `transparent` 属性が失われる。
トレイからの再表示は以下の順序で実行する。

```rust
let _ = window.unminimize(); // hide/show フローを回避
let _ = window.show();
let _ = window.set_focus();
let _ = window.set_always_on_top(false); // トグルで macOS の再描画を強制
let _ = window.set_always_on_top(true);  // alwaysOnTop: true の設定を維持
```

- `window.show()` 単独では透過が復帰しないことがある
- `always_on_top` の false→true トグルが再描画のトリガーになる

---

## ドラッグ移動

- ヘッダーとフッターに `data-tauri-drag-region` 属性を付与する
- ボタン等の操作要素には CSS で `-webkit-app-region: no-drag` を設定し、ドラッグ対象から除外する

---

## Activation Policy

```rust
app.set_activation_policy(tauri::ActivationPolicy::Accessory);
```

- Dock とアプリスイッチャーにアプリを表示しない
- メニューバーのトレイアイコンからのみアクセスする

---

## トレイアイコン

| 操作 | 処理 |
|------|------|
| 左クリック | ウィンドウ表示・非表示トグル |
| 右クリック | コンテキストメニュー表示 |
| Quit メニュー | `app.exit(0)` でアプリ終了 |

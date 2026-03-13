mod config;
mod todoist;

use tauri::{
    menu::{MenuBuilder, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Manager, LogicalPosition,
};
use todoist::{fetch_p1_tasks, close_task, Task};

#[tauri::command]
async fn get_tasks() -> Result<Vec<Task>, String> {
    fetch_p1_tasks().await
}

#[tauri::command]
async fn complete_task(task_id: String) -> Result<(), String> {
    close_task(&task_id).await
}

#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 設定画面の初期表示用: 保存済みトークンを返す
#[tauri::command]
fn get_token() -> String {
    config::load_config().token.unwrap_or_default()
}

/// 設定画面から保存されたトークンを書き込む
#[tauri::command]
fn save_token(token: String) -> Result<(), String> {
    config::save_config(&config::AppConfig { token: Some(token) })
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            // macOS: hide() → show() フローで transparent が失われるのを防ぐため
            // unminimize() を使い、always_on_top トグルで再描画を強制する
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.set_always_on_top(false);
            let _ = window.set_always_on_top(true); // alwaysOnTop: true の設定を維持
        }
    }
}

fn open_settings(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("settings") {
        let _ = w.show();
        let _ = w.set_focus();
        return;
    }
    let _ = tauri::WebviewWindowBuilder::new(
        app,
        "settings",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("Todoist Focus Widget – 設定")
    .inner_size(420.0, 230.0)
    .resizable(false)
    .build();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_tasks, complete_task, open_url, get_token, save_token
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // macOS: window shadow を無効化（透過ウィンドウ四隅の白を防ぐ）
            let _ = window.set_shadow(false);

            // Mac 右上に配置
            if let Some(monitor) = window.current_monitor()? {
                let scale = monitor.scale_factor();
                let screen_w = monitor.size().width as f64 / scale;
                window.set_position(LogicalPosition::new(screen_w - 280.0, 40.0))?;
            }

            // macOSPrivateApi: true により wry が WKWebViewConfiguration レベルで
            // drawsBackground=false を設定する（永続的）。setup 内の同期 with_webview は不要。

            // main ウィンドウの × ボタンを「隠す」に変更（アプリは終了しない）
            let win = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = win.hide();
                }
            });

            // トレイメニュー
            let toggle_item =
                MenuItem::with_id(app, "toggle", "表示 / 非表示", true, None::<&str>)?;
            let settings_item =
                MenuItem::with_id(app, "settings", "設定...", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit = PredefinedMenuItem::quit(app, Some("Quit"))?;
            let menu = MenuBuilder::new(app)
                .items(&[&toggle_item, &settings_item, &separator, &quit])
                .build()?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Todoist Focus Widget")
                .menu(&menu)
                .show_menu_on_left_click(true) // クリックは常にメニューを表示
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "toggle" => toggle_window(app),
                    "settings" => open_settings(app),
                    _ => {}
                })
                .build(app)?;

            // Dock 非表示を Tauri ネイティブ API で設定する
            // （LSUIElement ではなく runtime API を使うことで、tao が applicationDidFinishLaunching で
            //   Accessory→Regular にポリシーを戻してしまう問題を回避する）
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // macOSPrivateApi: true により wry が NSWindow 透過と drawsBackground=false を
            // 設定レベルで永続的に設定するため、ObjC による手動再適用は不要。

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

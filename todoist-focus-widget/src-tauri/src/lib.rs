mod todoist;

use tauri::{Manager, LogicalPosition};
use todoist::{fetch_p1_tasks, close_task, Task};

#[tauri::command]
async fn get_tasks() -> Result<Vec<Task>, String> {
    fetch_p1_tasks().await
}

#[tauri::command]
async fn complete_task(task_id: String) -> Result<(), String> {
    close_task(&task_id).await
}

/// macOS の open コマンドで URL をデフォルトブラウザで開く
#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_tasks, complete_task, open_url])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Mac 右上に配置
            if let Some(monitor) = window.current_monitor()? {
                let scale = monitor.scale_factor();
                let screen_w = monitor.size().width as f64 / scale;
                window.set_position(LogicalPosition::new(screen_w - 280.0, 40.0))?;
            }

            // WKWebView の背景色を完全透明に設定 → 四隅の白を消す
            #[cfg(target_os = "macos")]
            window.with_webview(|wv| {
                use objc::{msg_send, sel, sel_impl, class};
                use objc::runtime::{Object, NO};
                unsafe {
                    let view = wv.inner() as *mut Object;
                    // WKWebView 自体を非不透明に
                    let _: () = msg_send![view, setOpaque: NO];
                    // 背景色をクリア
                    let clear: *mut Object = msg_send![class!(NSColor), clearColor];
                    let _: () = msg_send![view, setBackgroundColor: clear];
                    // drawsBackground = false で WKWebView がページ背景を描画しないようにする
                    // (private KVC だが macOS の透過ウィンドウでは事実上必須)
                    let key = std::ffi::CString::new("drawsBackground").unwrap();
                    let key_ns: *mut Object = msg_send![
                        class!(NSString),
                        stringWithUTF8String: key.as_ptr()
                    ];
                    let val: *mut Object = msg_send![class!(NSNumber), numberWithBool: NO];
                    let _: () = msg_send![view, setValue: val forKey: key_ns];
                }
            })?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

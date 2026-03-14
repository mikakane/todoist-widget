use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct AppConfig {
    pub token: Option<String>,
}

fn config_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    PathBuf::from(home)
        .join(".config")
        .join("todoist-focus-widget")
        .join("config.json")
}

pub fn load_config() -> AppConfig {
    std::fs::read_to_string(config_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())
}

/// config ファイル → .env 環境変数 の順でトークンを解決する
pub fn get_token() -> Result<String, String> {
    let config = load_config();
    if let Some(token) = config.token.filter(|t| !t.is_empty()) {
        return Ok(token);
    }
    std::env::var("TODOIST_TOKEN").map_err(|_| {
        "トークン未設定。メニューバーアイコン右クリック → 設定... からトークンを登録してください。"
            .to_string()
    })
}

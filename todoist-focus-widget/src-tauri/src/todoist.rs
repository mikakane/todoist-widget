use reqwest::Client;
use serde::{Deserialize, Serialize};
use chrono::Local;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Due {
    pub date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub content: String,
    pub priority: u8,
    pub due: Option<Due>,
    pub url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TasksPage {
    results: Vec<Task>,
    next_cursor: Option<String>,
}

/// Todoist API v1 から今日の P1 タスクを全件取得する
pub async fn fetch_p1_tasks() -> Result<Vec<Task>, String> {
    let token = std::env::var("TODOIST_TOKEN")
        .map_err(|_| "TODOIST_TOKEN が未設定です。.env を確認してください。".to_string())?;

    // 今日の日付文字列 (例: "2026-03-12")
    let today = Local::now().format("%Y-%m-%d").to_string();

    let client = Client::new();
    let mut raw: Vec<Task> = Vec::new();
    let mut cursor: Option<String> = None;

    // API フィルタで P1 タスクを取得 (Todoist の "today" は期限切れも含むため
    // クライアント側で today の日付を厳密にチェックする)
    loop {
        let mut req = client
            .get("https://api.todoist.com/api/v1/tasks")
            .bearer_auth(&token)
            .query(&[("filter", "p1")]);  // p1 のみ指定、日付はクライアント側でチェック

        if let Some(ref c) = cursor {
            req = req.query(&[("cursor", c.as_str())]);
        }

        let response = req.send().await.map_err(|e| format!("接続エラー: {e}"))?;
        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|e| format!("レスポンス読み取りエラー: {e}"))?;

        if !status.is_success() {
            return Err(format!(
                "API {}: {}",
                status.as_u16(),
                body.chars().take(200).collect::<String>()
            ));
        }

        if body.trim_start().starts_with('[') {
            let tasks: Vec<Task> = serde_json::from_str(&body).map_err(|e| {
                format!("JSON parse error: {e}\nbody: {}", body.chars().take(200).collect::<String>())
            })?;
            raw.extend(tasks);
            break;
        }

        let page: TasksPage = serde_json::from_str(&body).map_err(|e| {
            format!("JSON parse error: {e}\nbody: {}", body.chars().take(200).collect::<String>())
        })?;

        raw.extend(page.results);

        match page.next_cursor {
            Some(c) if !c.is_empty() => cursor = Some(c),
            _ => break,
        }
    }

    // クライアント側で「P1 かつ due.date が今日と完全一致」するタスクのみ残す
    // Todoist API では priority=4 が P1 (最高優先度、赤)
    // due.date は "YYYY-MM-DD" または "YYYY-MM-DDTHH:MM:SS" 形式
    let filtered = raw
        .into_iter()
        .filter(|t| {
            t.priority == 4
                && t.due
                    .as_ref()
                    .and_then(|d| d.date.as_deref())
                    .map(|d| d.len() >= 10 && &d[..10] == today)
                    .unwrap_or(false)
        })
        .collect();

    Ok(filtered)
}

/// タスクを完了状態にする（繰り返しタスクは今回分のみ完了）
pub async fn close_task(task_id: &str) -> Result<(), String> {
    let token = std::env::var("TODOIST_TOKEN")
        .map_err(|_| "TODOIST_TOKEN が未設定です。".to_string())?;

    // Sync API の item_close を使う。
    // item_close は「今回の分だけ完了して次の繰り返しをスケジュール」する。
    let millis = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let cmd_uuid = format!("{millis}-{task_id}");

    let body = serde_json::json!({
        "commands": [{
            "type": "item_close",
            "uuid": cmd_uuid,
            "args": { "id": task_id }
        }]
    });

    let client = Client::new();
    let response = client
        .post("https://api.todoist.com/sync/v9/sync")
        .bearer_auth(&token)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("接続エラー: {e}"))?;

    let status = response.status();
    let text = response
        .text()
        .await
        .unwrap_or_default();

    if !status.is_success() {
        return Err(format!("Sync API {}: {}", status.as_u16(), &text[..text.len().min(200)]));
    }

    // Sync API は HTTP 200 でも個別コマンドが失敗することがある
    // sync_status の中にエラーがあれば報告する
    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&text) {
        if let Some(sync_status) = val.get("sync_status") {
            if let Some(result) = sync_status.get(&cmd_uuid) {
                if result != "ok" {
                    return Err(format!("item_close 失敗: {result}"));
                }
            }
        }
    }

    Ok(())
}

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import "./Settings.css";

export default function Settings() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    invoke<string>("get_token").then(setToken).catch(() => {});
    isEnabled().then(setAutostart).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await invoke("save_token", { token });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  const handleAutostartToggle = async () => {
    try {
      if (autostart) {
        await disable();
      } else {
        await enable();
      }
      setAutostart(!autostart);
    } catch {
      // autostart の変更に失敗しても UI はそのまま
    }
  };

  const handleCancel = () => getCurrentWindow().close();

  return (
    <div className="settings-root">
      <h2 className="settings-title">⚙️ 設定</h2>

      <div className="settings-field">
        <label>Todoist API トークン</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="API トークンを入力"
          className="settings-input"
          autoFocus
        />
        <p className="settings-hint">
          <a
            href="#"
            className="settings-link"
            onClick={(e) => {
              e.preventDefault();
              invoke("open_url", {
                url: "https://app.todoist.com/app/settings/integrations/developer",
              });
            }}
          >
            Todoist 設定 → 連携 → Developer
          </a>
          {" "}から取得できます
        </p>
      </div>

      <div className="settings-field settings-field--row">
        <label>ログイン時に起動</label>
        <button
          role="switch"
          aria-checked={autostart}
          className={`toggle-switch${autostart ? " toggle-switch--on" : ""}`}
          onClick={handleAutostartToggle}
        />
      </div>

      <div className="settings-actions">
        <button className="btn-save" onClick={handleSave}>
          保存
        </button>
        <button className="btn-cancel" onClick={handleCancel}>
          キャンセル
        </button>
        {status === "saved" && <span className="status-ok">✓ 保存しました</span>}
        {status === "error" && <span className="status-err">保存に失敗しました</span>}
      </div>
    </div>
  );
}

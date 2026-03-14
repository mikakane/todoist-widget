import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { useTasks } from "./hooks/useTasks";
import { TaskItem } from "./components/TaskItem";
import "./App.css";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const { tasks, total, loading, refreshing, error, lastUpdated, closeTask, refresh } = useTasks();
  const widgetRef = useRef<HTMLDivElement>(null);

  // ホイールスクロールを完全に禁止
  useEffect(() => {
    const prevent = (e: WheelEvent) => e.preventDefault();
    window.addEventListener("wheel", prevent, { passive: false });
    return () => window.removeEventListener("wheel", prevent);
  }, []);

  // コンテンツ高さに合わせてウィンドウを自動リサイズ
  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;

    const applySize = async () => {
      const h = el.offsetHeight;
      if (h > 0) {
        try {
          await getCurrentWindow().setSize(new LogicalSize(260, h));
        } catch (e) {
          console.error("setSize failed:", e);
        }
      }
    };

    const raf = requestAnimationFrame(() => { applySize(); });
    const observer = new ResizeObserver(applySize);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [tasks, total, loading, error, lastUpdated]);

  const handleClose = async () => {
    try {
      await getCurrentWindow().hide();
    } catch (e) {
      console.error("hide failed:", e);
    }
  };

  return (
    <div className="widget" ref={widgetRef}>
      {/* ヘッダー: CSS + data 属性の二重指定でドラッグを確実に有効化 */}
      <div className="header" data-tauri-drag-region>
        <span className="header-title" data-tauri-drag-region>🔥 TODAY P1</span>
        <div className="header-actions">
          <button
            className="action-btn"
            onClick={refresh}
            title="更新"
            disabled={refreshing}
            aria-label="更新"
          >
            {refreshing ? "…" : "↺"}
          </button>
          <button className="action-btn" onClick={handleClose} title="閉じる" aria-label="閉じる">
            ×
          </button>
        </div>
      </div>

      <div className="divider" />

      {/* タスク一覧 */}
      {error ? (
        <div className="error">{error}</div>
      ) : loading && tasks.length === 0 ? (
        <div className="empty">読み込み中...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">タスクなし ✅</div>
      ) : (
        tasks.map((task) => (
          <TaskItem key={task.id} task={task} onClose={closeTask} />
        ))
      )}

      {/* フッター: ドラッグ可能 */}
      {lastUpdated && (
        <div className="footer" data-tauri-drag-region>
          <span className="total-badge" title={`今日の P1 タスク合計 ${total} 件`}>
            🔥 <strong>{total}</strong>
          </span>
          <span>updated {formatTime(lastUpdated)}</span>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { useTasks } from "./hooks/useTasks";
import { TaskItem } from "./components/TaskItem";
import "./App.css";

const TODOIST_RED = "#DB4035";
const TEXT_SECONDARY = "#8a8a8a";

function FlameIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={TODOIST_RED}>
      <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
    </svg>
  );
}

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      width={14} height={14} viewBox="0 0 24 24" fill={TEXT_SECONDARY}
      style={spinning ? { animation: "spin 0.8s linear infinite" } : {}}
    >
      <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill={TEXT_SECONDARY}>
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  );
}

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
        <span className="header-title" data-tauri-drag-region>
          <FlameIcon size={18} />
          TODAY P1
        </span>
        <div className="header-actions">
          <button
            className="action-btn"
            onClick={refresh}
            title="更新"
            disabled={refreshing}
            aria-label="更新"
          >
            <RefreshIcon spinning={refreshing} />
          </button>
          <button className="action-btn" onClick={handleClose} title="閉じる" aria-label="閉じる">
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="task-list">
        {error ? (
          <div className="error">{error}</div>
        ) : loading && tasks.length === 0 ? (
          <div className="empty">読み込み中...</div>
        ) : tasks.length === 0 ? (
          <div className="empty">タスクなし 🎉</div>
        ) : (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} onClose={closeTask} />
          ))
        )}
      </div>

      {/* フッター: ドラッグ可能 */}
      {lastUpdated && (
        <div className="footer" data-tauri-drag-region>
          <div className="total-badge" title={`今日の P1 タスク合計 ${total} 件`}>
            <FlameIcon size={13} />
            {total}
          </div>
          <span>updated {formatTime(lastUpdated)}</span>
        </div>
      )}
    </div>
  );
}

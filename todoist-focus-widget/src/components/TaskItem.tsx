import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Task } from "../hooks/useTasks";

interface Props {
  task: Task;
  onClose: (id: string) => Promise<void>;
}

export function TaskItem({ task, onClose }: Props) {
  const [closing, setClosing] = useState(false);

  // チェックボックスクリック → タスク完了
  const handleCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (closing) return;
    setClosing(true);
    await onClose(task.id);
  };

  // テキストクリック → Todoist でタスクを開く
  const handleOpen = async () => {
    const url = task.url ?? `https://app.todoist.com/app/task/${task.id}`;
    try {
      await invoke("open_url", { url });
    } catch (e) {
      console.error("open_url failed:", e);
    }
  };

  return (
    <div className="task-item" style={{ opacity: closing ? 0.4 : 1 }}>
      {/* 丸チェックボックス */}
      <div
        className={`checkbox${closing ? " checked" : ""}`}
        onClick={handleCheck}
        title="完了にする"
      >
        {closing && (
          <svg width={10} height={10} viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        )}
      </div>

      {/* タスク内容 */}
      <span
        className="content"
        onClick={handleOpen}
        title="Todoist で開く"
        style={{ textDecoration: closing ? "line-through" : "none" }}
      >
        {task.content}
      </span>

      {/* P1 バッジ */}
      <span className="p1-badge">P1</span>
    </div>
  );
}

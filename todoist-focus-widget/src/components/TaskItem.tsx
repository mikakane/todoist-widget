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
      <span
        className="checkbox"
        onClick={handleCheck}
        title="完了にする"
      >
        {closing ? "✓" : "☐"}
      </span>
      <span
        className="content"
        onClick={handleOpen}
        title="Todoist で開く"
      >
        {task.content}
      </span>
    </div>
  );
}

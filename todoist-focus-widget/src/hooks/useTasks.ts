import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface Task {
  id: string;
  content: string;
  priority: number;
  due?: { date: string };
  url?: string;
}

const DISPLAY_LIMIT = 3;
const REFRESH_INTERVAL_MS = 30_000;

export function useTasks() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const result = await invoke<Task[]>("get_tasks");
      setAllTasks(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(String(e));
      console.error("Failed to fetch tasks:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
  }, [fetchTasks]);

  const closeTask = useCallback(
    async (taskId: string) => {
      try {
        await invoke("complete_task", { taskId });
        await fetchTasks();
      } catch (e) {
        console.error("Failed to close task:", e);
      }
    },
    [fetchTasks]
  );

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  return {
    tasks: allTasks.slice(0, DISPLAY_LIMIT), // 表示は最大3件
    total: allTasks.length,                  // P1 今日タスクの全件数
    loading,
    refreshing,
    error,
    lastUpdated,
    closeTask,
    refresh,
  };
}

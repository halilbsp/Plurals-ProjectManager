"use client";

import { useEffect, useState } from "react";

import {
  getTasks,
  createTask,
  type Task,
} from "@/api/task";

export default function TaskPanel() {
  const [list, setList] = useState<Task[]>([]);
  const [title, setTitle] = useState("");

  const projectId = 1;

  const load = async () => {
    const data = await getTasks(projectId);
    setList(data);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      const data = await getTasks(projectId);
      setList(data);
    };
    void fetchTasks();
  }, []);

  const handleCreate = async () => {
    await createTask({
      title,
      project_id: projectId,
      status: "todo",
      priority: "medium",
    });
    setTitle("");
    load();
  };

  return (
    <div className="bg-white dark:bg-[#1A1530] p-6 rounded-2xl border border-gray-100 dark:border-white/10 transition-colors">
      <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Tasks</h2>

      <div className="flex gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 rounded-lg w-full text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 transition-colors"
        />
        <button
          onClick={handleCreate}
          className="bg-[#34247A] hover:bg-[#2A1D63] text-white px-4 rounded-lg transition-colors"
        >
          Add
        </button>
      </div>

      {list.map((t) => (
        <div key={t.id} className="bg-gray-100 dark:bg-white/5 p-2 rounded mb-2 text-gray-700 dark:text-gray-200">
          {t.title}
        </div>
      ))}
    </div>
  );
}
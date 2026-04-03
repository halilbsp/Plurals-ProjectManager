"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Plus,
  Rocket,
  Trash2,
  X,
} from "lucide-react";

import { getTasks, type Task } from "@/api/task";
import {
  getLaunches,
  createLaunch,
  deleteLaunch,
  type Launch,
} from "@/api/launch";
import { useProjectContext } from "@/context/ProjectContext";

export default function BottomSection() {
  const { selectedProjectId, projects } = useProjectContext();
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingLaunches, setIsLoadingLaunches] = useState(true);

  const [showAddLaunch, setShowAddLaunch] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    const loadCompletedTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const tasks = await getTasks(selectedProjectId);
        const done = tasks
          .filter((t) => t.status === "done")
          .sort((a, b) => b.id - a.id)
          .slice(0, 5);
        setCompletedTasks(done);
      } catch (error) {
        console.error("Completed tasks could not be loaded:", error);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    void loadCompletedTasks();
  }, [selectedProjectId]);

  const loadLaunches = async () => {
    setIsLoadingLaunches(true);
    try {
      const data = await getLaunches();
      setLaunches(data);
    } catch (error) {
      console.error("Launches could not be loaded:", error);
    } finally {
      setIsLoadingLaunches(false);
    }
  };

  useEffect(() => {
    void loadLaunches();
  }, []);

  const handleCreateLaunch = async () => {
    if (!newTitle.trim() || !newDate) return;
    try {
      await createLaunch({
        title: newTitle.trim(),
        description: newDesc.trim() || selectedProject?.name || "",
        launch_date: newDate,
        project_id: selectedProjectId,
      });
      setNewTitle("");
      setNewDesc("");
      setNewDate("");
      setShowAddLaunch(false);
      await loadLaunches();
    } catch (err) {
      console.error("Failed to create launch:", err);
    }
  };

  const handleDeleteLaunch = async (id: number) => {
    try {
      await deleteLaunch(id);
      await loadLaunches();
    } catch (err) {
      console.error("Failed to delete launch:", err);
    }
  };

  const formatLaunchDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      year: date.getFullYear(),
    };
  };

  const resultsLabel = isLoadingTasks
    ? "Loading..."
    : `${String(completedTasks.length).padStart(2, "0")} results`;

  const priorityBadge: Record<string, string> = {
    high: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20",
    medium: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20",
    low: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-2">
      {/* ── Recently Completed Tasks ── */}
      <div className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-50 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">
            Recently Completed Tasks
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold">
              {resultsLabel}
            </span>
            <div className="flex -space-x-2">
              <img src="https://i.pravatar.cc/150?img=60" className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1A1530]" alt="Collaborator" />
              <img src="https://i.pravatar.cc/150?img=61" className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1A1530]" alt="Collaborator" />
              <img src="https://i.pravatar.cc/150?img=62" className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1A1530]" alt="Collaborator" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isLoadingTasks &&
            [1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />
                  <div>
                    <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-32 mb-1.5 animate-pulse" />
                    <div className="h-3 bg-gray-50 dark:bg-white/5 rounded w-20 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}

          {!isLoadingTasks &&
            completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/10 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-500/10 shadow-sm">
                    <span className="text-base font-bold text-green-600 dark:text-green-400">
                      {task.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-[14px] group-hover:text-[#34247A] dark:group-hover:text-[#7C5DFA] transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                      Project:{" "}
                      <span className="text-blue-500 dark:text-blue-400 font-semibold">
                        #{task.project_id}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-green-500 dark:text-green-400">
                    <CheckCircle2 size={16} className="fill-green-100 dark:fill-green-500/20" />
                    <span className="text-xs font-semibold">Done</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                      priorityBadge[task.priority] || priorityBadge.medium
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}

          {!isLoadingTasks && completedTasks.length === 0 && (
            <div className="flex items-center justify-center p-10 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-sm font-medium text-gray-400 dark:text-gray-500">
              There are no completed tasks yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Scheduled Launches ── */}
      <div className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-50 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <Rocket size={20} className="text-[#34247A] dark:text-[#7C5DFA]" />
            Scheduled Launches
          </h2>
          <button
            onClick={() => setShowAddLaunch(!showAddLaunch)}
            className="text-[#34247A] dark:text-[#7C5DFA] text-[12px] font-bold hover:text-[#7C5DFA] dark:hover:text-[#a78bfa] transition-colors flex items-center gap-1"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {/* Add Launch Form */}
        {showAddLaunch && (
          <div className="mb-5 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Launch title..."
              className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Company / Team name..."
              className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] text-gray-700 dark:text-gray-200 transition-colors"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleCreateLaunch()}
                disabled={!newTitle.trim() || !newDate}
                className="px-4 py-2 bg-[#34247A] text-white text-xs font-bold rounded-xl hover:bg-[#2A1D63] transition-colors disabled:opacity-50"
              >
                Schedule
              </button>
              <button
                onClick={() => {
                  setShowAddLaunch(false);
                  setNewTitle("");
                  setNewDesc("");
                  setNewDate("");
                }}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Launch List */}
        <div className="space-y-5">
          {isLoadingLaunches && (
            <div className="text-sm text-gray-400 dark:text-gray-500 py-4">Loading launches...</div>
          )}

          {!isLoadingLaunches && launches.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              No scheduled launches yet.
            </div>
          )}

          {!isLoadingLaunches &&
            launches.map((launch) => {
              const { day, month, year } = formatLaunchDate(launch.launch_date);
              return (
                <div key={launch.id} className="flex items-start gap-4 group">
                  <div className="text-center w-12 pt-1 border-r border-gray-100 dark:border-white/10 pr-4 flex-shrink-0">
                    <div className="font-bold text-gray-900 dark:text-white text-xl leading-none">{day}</div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs font-semibold mt-1">{month}</div>
                    <div className="text-gray-300 dark:text-gray-600 text-[10px] uppercase font-bold mt-0.5">{year}</div>
                  </div>
                  <div className="flex-1 pt-1 ml-2">
                    <h4 className="font-bold text-gray-900 dark:text-white text-[14px] mb-1 group-hover:text-[#34247A] dark:group-hover:text-[#7C5DFA] transition-colors">
                      {launch.title}
                    </h4>
                    <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                      {launch.description}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleDeleteLaunch(launch.id)}
                    className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all mt-1 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
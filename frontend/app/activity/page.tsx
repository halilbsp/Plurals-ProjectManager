"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  MessageSquare,
  FolderKanban,
  ArrowRight,
  Rocket,
  Radio,
  UserPlus,
  PlayCircle,
  Upload,
  Clock,
  Filter,
} from "lucide-react";

import { api } from "@/api/api";
import { useProjectContext } from "@/context/ProjectContext";

interface ActivityItem {
  id: number;
  project_id: number | null;
  user_name: string;
  user_avatar: string;
  action: string;
  target: string;
  detail: string;
  created_at: string;
}

const actionIcons: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  created: FolderKanban,
  "commented on": MessageSquare,
  moved: ArrowRight,
  uploaded: Upload,
  scheduled: Rocket,
  sent: Radio,
  joined: UserPlus,
  started: PlayCircle,
};

const actionColors: Record<string, string> = {
  completed: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  created: "bg-purple-50 dark:bg-purple-500/10 text-[#34247A] dark:text-[#7C5DFA]",
  "commented on": "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  moved: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
  uploaded: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  scheduled: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400",
  sent: "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400",
  joined: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  started: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const targetLabels: Record<string, string> = {
  task: "Task",
  project: "Project",
  file: "File",
  launch: "Launch",
  broadcast: "Broadcast",
};

type FilterType = "all" | "task" | "project" | "file" | "launch" | "broadcast";

export default function ActivityPage() {
  const { selectedProjectId, projects } = useProjectContext();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showAllProjects, setShowAllProjects] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (!showAllProjects) params.project_id = selectedProjectId;
      const res = await api.get<ActivityItem[]>("/activity-log", { params });
      setActivities(res.data);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, showAllProjects]);

  useEffect(() => { void loadActivities(); }, [loadActivities]);

  const filteredActivities = filter === "all" ? activities : activities.filter((a) => a.target === filter);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const groupByDay = (items: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};
    items.forEach((item) => {
      const date = new Date(item.created_at);
      const diff = Date.now() - date.getTime();
      const days = Math.floor(diff / 86400000);
      let label: string;
      if (days === 0) label = "Today";
      else if (days === 1) label = "Yesterday";
      else if (days < 7) label = `${days} days ago`;
      else label = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  };

  const grouped = groupByDay(filteredActivities);
  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "task", label: "Tasks" },
    { value: "project", label: "Projects" },
    { value: "broadcast", label: "Broadcasts" },
    { value: "file", label: "Files" },
    { value: "launch", label: "Launches" },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white tracking-tight">Activity Feed</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Track everything happening across{" "}
            {showAllProjects ? (
              <span className="font-semibold text-[#34247A] dark:text-[#7C5DFA]">all projects</span>
            ) : (
              <span className="font-semibold text-[#34247A] dark:text-[#7C5DFA]">{selectedProject?.name ?? "your project"}</span>
            )}
            .
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setShowAllProjects(false)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${!showAllProjects ? "bg-white dark:bg-white/10 text-[#34247A] dark:text-[#7C5DFA] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Current Project
          </button>
          <button
            onClick={() => setShowAllProjects(true)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${showAllProjects ? "bg-white dark:bg-white/10 text-[#34247A] dark:text-[#7C5DFA] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            All Projects
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-400 dark:text-gray-500 mr-1" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filter === f.value
                ? "bg-[#34247A] text-white shadow-sm"
                : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-[#1A1530] rounded-[24px] shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden transition-colors">
        {isLoading && (
          <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">Loading activity...</div>
        )}

        {!isLoading && filteredActivities.length === 0 && (
          <div className="p-12 text-center">
            <Clock size={40} className="text-gray-200 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No activity found.</p>
          </div>
        )}

        {!isLoading &&
          Object.entries(grouped).map(([dayLabel, items]) => (
            <div key={dayLabel}>
              <div className="px-8 py-3 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-50 dark:border-white/5 sticky top-0 z-[1]">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">{dayLabel}</span>
              </div>

              {items.map((item, idx) => {
                const Icon = actionIcons[item.action] || Clock;
                const colorClass = actionColors[item.action] || "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400";

                return (
                  <div key={item.id} className="flex items-start gap-4 px-8 py-4 border-b border-gray-50 dark:border-white/5 last:border-b-0 hover:bg-gray-50/30 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      {idx < items.length - 1 && <div className="w-px h-6 bg-gray-100 dark:bg-white/10 mt-2" />}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.user_avatar ? (
                          <img src={item.user_avatar} alt={item.user_name} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[9px] font-bold text-gray-500 dark:text-gray-400">{item.user_name.charAt(0)}</div>
                        )}
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.user_name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.action}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${colorClass}`}>
                          {targetLabels[item.target] || item.target}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">{item.detail}</p>
                    </div>

                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0 pt-1">{formatTime(item.created_at)}</span>
                  </div>
                );
              })}
            </div>
          ))}
      </div>
    </div>
  );
}
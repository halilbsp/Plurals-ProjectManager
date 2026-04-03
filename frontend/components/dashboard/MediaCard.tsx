"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  MessageSquare,
  TrendingUp,
  Users,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

import { api } from "@/api/api";
import { useProjectContext } from "@/context/ProjectContext";

interface ActivityUser {
  name: string;
  avatar: string;
  role: string;
}

interface LatestComment {
  id: number;
  content: string;
  user_name: string;
  created_at: string;
}

interface ActivityData {
  user: ActivityUser;
  comment_count: number;
  total_tasks: number;
  todo_tasks: number;
  doing_tasks: number;
  done_tasks: number;
  completion_percent: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  member_count: number;
  activity_count: number;
  unique_commenters: number;
  latest_comments: LatestComment[];
}

const fallbackData: ActivityData = {
  user: { name: "Team", avatar: "", role: "Member" },
  comment_count: 0,
  total_tasks: 0,
  todo_tasks: 0,
  doing_tasks: 0,
  done_tasks: 0,
  completion_percent: 0,
  high_priority: 0,
  medium_priority: 0,
  low_priority: 0,
  member_count: 0,
  activity_count: 0,
  unique_commenters: 0,
  latest_comments: [],
};

const periodOptions = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

export default function MediaCard() {
  const { selectedProjectId } = useProjectContext();
  const [data, setData] = useState<ActivityData>(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<ActivityData>("/activity/latest", {
          params: { project_id: selectedProjectId, period: selectedPeriod },
        });
        setData(res.data);
      } catch (err) {
        console.error("Activity could not be loaded:", err);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [selectedProjectId, selectedPeriod]);

  const currentPeriodLabel =
    periodOptions.find((p) => p.value === selectedPeriod)?.label ?? "Today";

  /* Progress bar segments */
  const total = data.total_tasks || 1;
  const donePercent = Math.round((data.done_tasks / total) * 100);
  const doingPercent = Math.round((data.doing_tasks / total) * 100);
  const todoPercent = 100 - donePercent - doingPercent;

  return (
    <div className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-white/10 flex flex-col h-[400px] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {data.user.avatar ? (
            <img
              src={data.user.avatar}
              alt={data.user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-sm font-bold text-[#34247A] dark:text-[#7C5DFA]">
              {data.user.name.charAt(0)}
            </div>
          )}
          <div>
            <span className="font-semibold text-gray-900 dark:text-white text-[15px]">
              {isLoading ? "Loading..." : data.user.name}
            </span>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              {data.user.role}
            </div>
          </div>
        </div>

        {/* Period Dropdown */}
        <div className="relative" ref={periodRef}>
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="font-medium text-[13px]">{currentPeriodLabel}</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${periodOpen ? "rotate-180" : ""}`}
            />
          </button>

          {periodOpen && (
            <div className="absolute right-0 top-[calc(100%+4px)] w-[150px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-[0_12px_40px_rgba(52,36,122,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedPeriod(option.value);
                    setPeriodOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    selectedPeriod === option.value
                      ? "text-[#34247A] dark:text-[#7C5DFA] bg-purple-50/50 dark:bg-purple-500/10 font-semibold"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Visual Area */}
      <div className="flex-1 w-full rounded-[20px] mb-4 flex flex-col items-center justify-center overflow-hidden relative bg-gradient-to-tr from-[#A88BFA] to-[#8B5CF6] shadow-inner">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        {/* Completion Percentage */}
        <div className="relative z-10 mb-3">
          <div className="text-white font-bold text-[42px] leading-none drop-shadow-md">
            {data.completion_percent}%
          </div>
          <div className="text-white/60 text-[11px] font-semibold text-center mt-1 uppercase tracking-wider">
            Complete
          </div>
        </div>

        {/* Mini Stats Row */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
            <CheckCircle2 size={12} className="text-green-300" />
            <span className="text-white text-[11px] font-bold">{data.done_tasks} Done</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Loader2 size={12} className="text-yellow-300" />
            <span className="text-white text-[11px] font-bold">{data.doing_tasks} Active</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Circle size={12} className="text-white/60" />
            <span className="text-white text-[11px] font-bold">{data.todo_tasks} Todo</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 w-[85%] mt-3">
          <div className="flex rounded-full overflow-hidden h-[6px] bg-white/10">
            {donePercent > 0 && (
              <div
                className="bg-green-400 transition-all duration-500"
                style={{ width: `${donePercent}%` }}
              />
            )}
            {doingPercent > 0 && (
              <div
                className="bg-yellow-400 transition-all duration-500"
                style={{ width: `${doingPercent}%` }}
              />
            )}
            {todoPercent > 0 && (
              <div
                className="bg-white/20 transition-all duration-500"
                style={{ width: `${todoPercent}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div>
        {/* Priority Breakdown */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <ArrowUp size={13} className="text-red-500" strokeWidth={2.5} />
            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">
              {data.high_priority}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowRight size={13} className="text-orange-500" strokeWidth={2.5} />
            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">
              {data.medium_priority}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Med</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDown size={13} className="text-blue-500" strokeWidth={2.5} />
            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">
              {data.low_priority}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Low</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <TrendingUp size={13} className="text-[#34247A] dark:text-[#7C5DFA]" strokeWidth={2.5} />
            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">
              {data.total_tasks}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Total</span>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="flex items-center gap-5 text-gray-400 dark:text-gray-500 text-xs font-semibold">
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <MessageSquare size={14} />
            <span>
              {data.comment_count}{" "}
              {data.comment_count === 1 ? "comment" : "comments"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span>
              {data.member_count} {data.member_count === 1 ? "member" : "members"}
            </span>
          </div>

          {data.latest_comments.length > 0 && (
            <div className="flex -space-x-2 ml-auto">
              {data.latest_comments.slice(0, 3).map((c, i) => (
                <div
                  key={c.id}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1A1530] bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[9px] font-bold text-gray-500 dark:text-gray-400"
                  style={{ zIndex: 10 - i }}
                  title={c.user_name}
                >
                  {c.user_name.charAt(0)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

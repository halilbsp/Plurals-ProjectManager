"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, User } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getDashboardSummary,
  getDashboardAnalytics,
  type DashboardSummary,
  type WeeklyActivityPoint,
} from "@/api/dashboard";
import {
  getProjectMembers,
  type ProjectMember,
} from "@/api/user";
import { useProjectContext } from "@/context/ProjectContext";
import { useTheme } from "@/context/ThemeContext";

const fallbackSummary: DashboardSummary = {
  project_id: 1,
  project_name: "ARS - Design Team",
  project_description:
    "This project is focused on premium product design execution.",
  main_task_title: "Design Project",
  main_task_status: "In Progress",
  tasks_count: 24,
  logged_hours: 190,
};

const fallbackActivity: WeeklyActivityPoint[] = [
  { day: "Mon", completion_rate: 30, completed_tasks: 2, creation_rate: 40, created_tasks: 4 },
  { day: "Tue", completion_rate: 38, completed_tasks: 3, creation_rate: 48, created_tasks: 5 },
  { day: "Wed", completion_rate: 50, completed_tasks: 4, creation_rate: 55, created_tasks: 5 },
  { day: "Thu", completion_rate: 58, completed_tasks: 5, creation_rate: 52, created_tasks: 5 },
  { day: "Fri", completion_rate: 66, completed_tasks: 6, creation_rate: 65, created_tasks: 6 },
  { day: "Sat", completion_rate: 72, completed_tasks: 6, creation_rate: 60, created_tasks: 6 },
  { day: "Sun", completion_rate: 78, completed_tasks: 7, creation_rate: 68, created_tasks: 7 },
];

const statsPeriodOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const chartPeriodOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function ProjectStatsCard() {
  const { selectedProjectId } = useProjectContext();
  const { theme } = useTheme();
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [activity, setActivity] = useState<WeeklyActivityPoint[]>(fallbackActivity);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  /* ── Period States ── */
  const [statsPeriod, setStatsPeriod] = useState("monthly");
  const [statsDropdownOpen, setStatsDropdownOpen] = useState(false);
  const statsDropdownRef = useRef<HTMLDivElement>(null);

  const [chartPeriod, setChartPeriod] = useState("weekly");
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const chartDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ── Outside click handlers ── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statsDropdownRef.current && !statsDropdownRef.current.contains(e.target as Node)) {
        setStatsDropdownOpen(false);
      }
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(e.target as Node)) {
        setChartDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [summaryData, analyticsData, membersData] = await Promise.all([
          getDashboardSummary(selectedProjectId),
          getDashboardAnalytics(selectedProjectId),
          getProjectMembers(selectedProjectId),
        ]);
        setSummary(summaryData);
        setMembers(membersData);
        if (analyticsData.weekly_activity.length > 0) {
          setActivity(analyticsData.weekly_activity);
        }
      } catch (error) {
        console.error("Project stats could not be loaded:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [selectedProjectId, statsPeriod, chartPeriod]);

  const visibleMembers = members.slice(0, 3);

  const currentStatsLabel = statsPeriodOptions.find((p) => p.value === statsPeriod)?.label ?? "Monthly";
  const currentChartLabel = chartPeriodOptions.find((p) => p.value === chartPeriod)?.label ?? "Weekly";

  const tooltipStyle = theme === "dark"
    ? {
        backgroundColor: "#1E1A2E",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        color: "#fff",
        fontSize: "12px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
      }
    : {
        backgroundColor: "#140D33",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        color: "#fff",
        fontSize: "12px",
        boxShadow: "0 12px 30px rgba(6,4,18,0.3)",
      };

  return (
    <div
      className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-white/10 flex flex-col h-[400px] transition-colors"
      aria-busy={isLoading}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-1 tracking-tight">
            {summary.main_task_title}
          </h2>
          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs font-semibold">
            <User size={13} className="text-gray-400 dark:text-gray-500" />
            <span className="uppercase tracking-wider">
              {summary.main_task_status}
            </span>
          </div>
        </div>

        {/* Stats Period Dropdown */}
        <div className="relative" ref={statsDropdownRef}>
          <button
            onClick={() => {
              setStatsDropdownOpen(!statsDropdownOpen);
              setChartDropdownOpen(false);
            }}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="font-medium text-[13px]">{currentStatsLabel}</span>
            <ChevronDown size={14} className={`transition-transform ${statsDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {statsDropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+4px)] w-[140px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-[0_12px_40px_rgba(52,36,122,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-1">
              {statsPeriodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatsPeriod(option.value);
                    setStatsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    statsPeriod === option.value
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

      {/* Team + Stats */}
      <div className="flex gap-8 mb-6">
        <div>
          <div className="text-gray-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2">
            Team members
          </div>
          <div className="flex -space-x-2">
            {visibleMembers.map((member, index) => (
              <div key={member.id} className="relative group/tip">
                <img
                  src={member.user.avatar || `https://i.pravatar.cc/150?u=${member.user.email}`}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1A1530] shadow-sm object-cover"
                  style={{ zIndex: 10 - index }}
                  alt={member.user.name}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-semibold rounded-md opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {member.user.name}
                </div>
              </div>
            ))}
            {members.length === 0 && !isLoading && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1A1530] bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500 text-[10px] font-bold">
                ?
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="text-gray-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            Tasks
          </div>
          <div className="font-bold text-2xl text-gray-900 dark:text-white flex items-start gap-1">
            {summary.tasks_count}
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1" />
          </div>
        </div>
        <div>
          <div className="text-gray-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            Hours
          </div>
          <div className="font-bold text-2xl text-gray-900 dark:text-white">
            {summary.logged_hours}
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 dark:text-white text-[15px]">
            Tasks Activity
          </h3>

          {/* Chart Period Dropdown */}
          <div className="relative" ref={chartDropdownRef}>
            <button
              onClick={() => {
                setChartDropdownOpen(!chartDropdownOpen);
                setStatsDropdownOpen(false);
              }}
              className="flex items-center gap-1 text-blue-500 dark:text-blue-400 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 px-2 py-0.5 rounded-lg transition-colors"
            >
              <span className="font-semibold text-[13px]">{currentChartLabel}</span>
              <ChevronDown size={14} className={`transition-transform ${chartDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {chartDropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] w-[130px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-[0_12px_40px_rgba(52,36,122,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-1">
                {chartPeriodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setChartPeriod(option.value);
                      setChartDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-[13px] font-medium transition-colors ${
                      chartPeriod === option.value
                        ? "text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 font-semibold"
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

        {/* Legend */}
        <div className="flex items-center gap-6 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[3px] bg-green-500" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold tracking-wide">Created</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[3px] bg-purple-500" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold tracking-wide">Completed</span>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 w-full mt-1">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activity}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: theme === "dark" ? "#6b7280" : "#9CA3AF", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => {
                    const v = typeof value === "number" ? value : Number(value ?? 0);
                    if (name === "creation_rate") return [`${v}%`, "Created"];
                    if (name === "completion_rate") return [`${v}%`, "Completed"];
                    return [v, String(name)];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="creation_rate"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="completion_rate"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#a855f7", stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10" />
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";

import {
  getDashboardAnalytics,
  type DashboardAnalytics,
} from "@/api/dashboard";
import { useProjectContext } from "@/context/ProjectContext";
import { useTheme } from "@/context/ThemeContext";
import { exportAnalyticsCSV } from "@/api/task";

const fallbackAnalytics: DashboardAnalytics = {
  selected_project_id: 1,
  selected_project_name: "ARS - Design Team",
  weekly_activity: [
    { day: "Mon", completion_rate: 32, completed_tasks: 2, creation_rate: 40, created_tasks: 4 },
    { day: "Tue", completion_rate: 38, completed_tasks: 3, creation_rate: 48, created_tasks: 5 },
    { day: "Wed", completion_rate: 47, completed_tasks: 4, creation_rate: 58, created_tasks: 6 },
    { day: "Thu", completion_rate: 58, completed_tasks: 5, creation_rate: 52, created_tasks: 5 },
    { day: "Fri", completion_rate: 66, completed_tasks: 6, creation_rate: 65, created_tasks: 7 },
    { day: "Sat", completion_rate: 72, completed_tasks: 6, creation_rate: 60, created_tasks: 6 },
    { day: "Sun", completion_rate: 78, completed_tasks: 7, creation_rate: 68, created_tasks: 7 },
  ],
  project_hours: [
    { project_id: 1, name: "ARS - Design Team", hours: 96 },
    { project_id: 2, name: "Nova Mobile Launch", hours: 88 },
    { project_id: 3, name: "Horizon Web Revamp", hours: 104 },
  ],
};

export default function AnalyticsPage() {
  const { selectedProjectId } = useProjectContext();
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(fallbackAnalytics);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboardAnalytics(selectedProjectId);
        setAnalytics(data);
      } catch (error) {
        console.error("Analytics could not be loaded:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadAnalytics();
  }, [selectedProjectId]);

  const peakCompletionRate = Math.max(...analytics.weekly_activity.map((item) => item.completion_rate));
  const totalTrackedHours = analytics.project_hours.reduce((total, item) => total + item.hours, 0);

  const barTooltipStyle = theme === "dark"
    ? { backgroundColor: "#1E1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", boxShadow: "0 18px 40px rgba(0,0,0,0.4)" }
    : { backgroundColor: "#FFFFFF", border: "1px solid #EEF0F6", borderRadius: "18px", boxShadow: "0 18px 40px rgba(52, 36, 122, 0.12)" };

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(138,92,246,0.35),_transparent_38%),linear-gradient(135deg,#1B123F_0%,#24175A_45%,#130B32_100%)] p-8 text-white shadow-[0_24px_80px_rgba(52,36,122,0.32)]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.22),_transparent_28%)]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Analytics</span>
              {/* Export Button */}
              <button
                onClick={() => exportAnalyticsCSV(selectedProjectId)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white/80 transition-colors"
              >
                <Download size={12} />
                Export CSV
              </button>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">{analytics.selected_project_name}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
              Weekly completion momentum and project hour allocation are now synced with the active project switcher. The charts below refresh automatically when the selected project changes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-[280px]">
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Peak Rate</div>
              <div className="mt-2 text-3xl font-bold">{peakCompletionRate}%</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Total Hours</div>
              <div className="mt-2 text-3xl font-bold">{totalTrackedHours}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Status</div>
              <div className="mt-2 text-sm font-semibold text-white/80">{isLoading ? "Refreshing..." : "Live project analytics"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Area Chart */}
      <section className="rounded-[30px] bg-[linear-gradient(180deg,#24175A_0%,#18103E_100%)] p-6 shadow-[0_18px_60px_rgba(36,23,90,0.28)]">
        <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Weekly Tasks Activity</h2>
            <p className="text-sm text-white/60">A premium view of how fast the active project is converting work into completed outcomes.</p>
          </div>
          <div className="text-sm font-medium text-white/55">{isLoading ? "Loading data..." : "Updated from backend analytics"}</div>
        </div>

        <div className="mb-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#B794F4]" />
            <span className="text-xs font-medium text-white/55">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#48BB78]" />
            <span className="text-xs font-medium text-white/55">Created</span>
          </div>
        </div>

        <div className="h-[360px] w-full">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weekly_activity}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9F7AEA" stopOpacity={0.95} />
                    <stop offset="45%" stopColor="#7C5DFA" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#7C5DFA" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#48BB78" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#48BB78" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.16)", strokeWidth: 1 }}
                  contentStyle={{ backgroundColor: "#140D33", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", color: "#fff", boxShadow: "0 20px 40px rgba(6, 4, 18, 0.35)" }}
                  formatter={(value, name) => {
                    const v = typeof value === "number" ? value : Number(value ?? 0);
                    if (name === "completion_rate") return [`${v}%`, "Completion Rate"];
                    if (name === "creation_rate") return [`${v}%`, "Creation Rate"];
                    return [v, String(name)];
                  }}
                />
                <Area type="monotone" dataKey="creation_rate" stroke="#48BB78" strokeWidth={2} fill="url(#createdGradient)" activeDot={{ r: 5, strokeWidth: 0, fill: "#68D391" }} />
                <Area type="monotone" dataKey="completion_rate" stroke="#B794F4" strokeWidth={3} fill="url(#completionGradient)" activeDot={{ r: 6, strokeWidth: 0, fill: "#F6E05E" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-[24px] border border-white/8 bg-white/5" />
          )}
        </div>
      </section>

      {/* Bar Chart */}
      <section className="rounded-[30px] bg-white dark:bg-[#1A1530] p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors">
        <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logged Hours Across Projects</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Compare how many tracked hours each project is consuming right now.</p>
          </div>
          <div className="text-sm font-semibold text-[#34247A] dark:text-[#7C5DFA]">{analytics.project_hours.length} live projects</div>
        </div>

        <div className="h-[340px] w-full">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.project_hours} barCategoryGap={28}>
                <CartesianGrid stroke={theme === "dark" ? "rgba(255,255,255,0.06)" : "#F1F3F9"} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: theme === "dark" ? "#9CA3AF" : "#6B7280", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: theme === "dark" ? "#6B7280" : "#9CA3AF", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: theme === "dark" ? "rgba(124,93,250,0.08)" : "rgba(124,93,250,0.08)" }}
                  contentStyle={barTooltipStyle}
                  formatter={(value) => {
                    const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                    return [`${numericValue} hours`, "Tracked"];
                  }}
                />
                <Bar dataKey="hours" radius={[18, 18, 8, 8]} fill={theme === "dark" ? "#7C5DFA" : "#34247A"} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-[24px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5" />
          )}
        </div>
      </section>
    </div>
  );
}

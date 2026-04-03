"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalIcon } from "lucide-react";

import { getTasks, type Task } from "@/api/task";
import { useProjectContext } from "@/context/ProjectContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function SchedulePage() {
  const { selectedProjectId, projects } = useProjectContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getTasks(selectedProjectId);
        setTasks(data);
      } catch {
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [selectedProjectId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.due_date?.startsWith(dateStr));
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const priorityDot: Record<string, string> = {
    high: "bg-red-400",
    medium: "bg-orange-400",
    low: "bg-blue-400",
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-gray-900 dark:text-white tracking-tight">Schedule</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          View task deadlines for{" "}
          <span className="font-semibold text-[#34247A] dark:text-[#7C5DFA]">
            {selectedProject?.name ?? "your project"}
          </span>
          .
        </p>
      </div>

      {/* Calendar Card */}
      <div className="bg-white dark:bg-[#1A1530] rounded-[24px] shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden transition-colors">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-50 dark:border-white/5">
          <div className="flex items-center gap-3">
            <CalIcon size={22} className="text-[#34247A] dark:text-[#7C5DFA]" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500 dark:text-gray-400">
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-1.5 text-xs font-bold text-[#34247A] dark:text-[#7C5DFA] bg-purple-50 dark:bg-purple-500/10 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors uppercase tracking-wider"
            >
              Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500 dark:text-gray-400">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 border-b border-gray-50 dark:border-white/5">
          {DAYS.map((day) => (
            <div key={day} className="text-center py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = getTasksForDay(day);
            const isTodayCell = isToday(day);

            return (
              <div
                key={day}
                className={`min-h-[100px] border-b border-r border-gray-50 dark:border-white/5 p-2 transition-colors ${
                  isTodayCell ? "bg-purple-50/30 dark:bg-purple-500/5" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-1.5 w-7 h-7 flex items-center justify-center rounded-lg ${
                    isTodayCell ? "bg-[#34247A] dark:bg-[#7C5DFA] text-white" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {day}
                </div>

                <div className="flex flex-col gap-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-1.5 px-1.5 py-1 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none cursor-pointer hover:border-purple-200 dark:hover:border-purple-500/20 transition-colors"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[task.priority] || priorityDot.medium}`} />
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 px-1.5">+{dayTasks.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white dark:bg-[#1A1530] rounded-[24px] shadow-sm border border-gray-100 dark:border-white/10 p-6 transition-colors">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
          <Clock size={20} className="text-[#34247A] dark:text-[#7C5DFA]" />
          Upcoming Deadlines
        </h3>
        <div className="space-y-3">
          {isLoading && (
            <div className="text-sm text-gray-400 dark:text-gray-500 py-4">Loading tasks...</div>
          )}
          {!isLoading &&
            tasks
              .filter((t) => t.due_date)
              .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))
              .slice(0, 6)
              .map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${priorityDot[task.priority] || priorityDot.medium}`} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        task.status === "done"
                          ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                          : task.status === "doing"
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {task.status}
                    </span>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      {new Date(task.due_date!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
          {!isLoading && tasks.filter((t) => t.due_date).length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">No tasks with due dates found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
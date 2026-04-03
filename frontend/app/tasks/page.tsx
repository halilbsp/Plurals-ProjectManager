"use client";

import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import KanbanBoard from "@/components/task/KanbanBoard";
import { useProjectContext } from "@/context/ProjectContext";
import { exportTasksCSV, exportTasksPDF } from "@/api/task";

export default function TasksPage() {
  const { selectedProjectId } = useProjectContext();
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full h-full">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2B275A] dark:text-white">Task List</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your project tasks and workflow here.
          </p>
        </div>

        {/* Export Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1E1A2E] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-[#34247A] dark:hover:border-[#7C5DFA] transition-all shadow-sm"
          >
            <Download size={16} className="text-gray-400 dark:text-gray-500" />
            Export
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-[200px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(52,36,122,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              <div className="px-4 pt-3 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                  Download As
                </span>
              </div>

              <button
                onClick={() => {
                  exportTasksCSV(selectedProjectId);
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                  <FileSpreadsheet size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">CSV File</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">Spreadsheet format</div>
                </div>
              </button>

              <button
                onClick={() => {
                  exportTasksPDF(selectedProjectId);
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-t border-gray-50 dark:border-white/5"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <FileText size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">PDF Report</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">Formatted document</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1530] p-8 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm min-h-[500px] transition-colors">
        <KanbanBoard />
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import {
  FolderKanban,
  Plus,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";

import {
  createProject,
  deleteProject,
  updateProject,
} from "@/api/project";
import { getTasks, type Task } from "@/api/task";
import { useProjectContext } from "@/context/ProjectContext";

interface ProjectWithStats {
  id: number;
  name: string;
  workspace_id: number | null;
  taskCount: number;
  doneCount: number;
  doingCount: number;
}

export default function ProjectPage() {
  const {
    selectedProjectId,
    setSelectedProjectId,
    projects,
    reloadProjects,
  } = useProjectContext();

  const [projectStats, setProjectStats] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const stats: ProjectWithStats[] = [];
        for (const project of projects) {
          try {
            const tasks = await getTasks(project.id);
            stats.push({
              ...project,
              taskCount: tasks.length,
              doneCount: tasks.filter((t: Task) => t.status === "done").length,
              doingCount: tasks.filter((t: Task) => t.status === "doing").length,
            });
          } catch {
            stats.push({ ...project, taskCount: 0, doneCount: 0, doingCount: 0 });
          }
        }
        setProjectStats(stats);
      } finally {
        setIsLoading(false);
      }
    };
    if (projects.length > 0) void loadStats();
    else setIsLoading(false);
  }, [projects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createProject({ name: newName.trim() });
      await reloadProjects();
      setSelectedProjectId(created.id);
      setNewName("");
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleRename = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await updateProject(id, { name: editingName.trim() });
      await reloadProjects();
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      console.error("Failed to rename:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    try {
      await deleteProject(id);
      await reloadProjects();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white tracking-tight">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage all your projects in one place.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-[#34247A] hover:bg-[#2A1D63] text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg shadow-purple-900/10 active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
          New Project
        </button>
      </div>

      {/* Create Input */}
      {isCreating && (
        <div className="bg-white dark:bg-[#1A1530] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 transition-colors">
          <div className="flex items-center gap-3">
            <FolderKanban size={20} className="text-[#34247A] dark:text-[#7C5DFA]" />
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
                if (e.key === "Escape") { setIsCreating(false); setNewName(""); }
              }}
              placeholder="Enter project name..."
              className="flex-1 text-sm font-medium px-3 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
            />
            <button onClick={() => void handleCreate()} className="px-5 py-2 bg-[#34247A] text-white text-sm font-bold rounded-xl hover:bg-[#2A1D63] transition-colors">Create</button>
            <button onClick={() => { setIsCreating(false); setNewName(""); }} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-white/10 h-[200px] animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-2/3 mb-4" />
              <div className="h-3 bg-gray-50 dark:bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectStats.map((project) => (
            <div
              key={project.id}
              className={`bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border transition-all cursor-pointer group ${
                project.id === selectedProjectId
                  ? "border-[#34247A]/20 dark:border-[#7C5DFA]/30 shadow-[0_8px_30px_rgba(52,36,122,0.08)] dark:shadow-[0_8px_30px_rgba(124,93,250,0.1)]"
                  : "border-gray-100 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-500/20 hover:shadow-md"
              }`}
              onClick={() => setSelectedProjectId(project.id)}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold ${project.id === selectedProjectId ? "bg-[#34247A] text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-500/10 group-hover:text-[#34247A] dark:group-hover:text-[#7C5DFA]"} transition-colors`}>
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {editingId === project.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void handleRename(project.id); if (e.key === "Escape") setEditingId(null); }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-semibold px-2 py-1 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 w-[160px] text-gray-700 dark:text-gray-200 transition-colors"
                        />
                        <button onClick={(e) => { e.stopPropagation(); void handleRename(project.id); }} className="text-[#34247A] dark:text-[#7C5DFA] hover:text-[#7C5DFA]">
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-gray-900 dark:text-white text-[15px] group-hover:text-[#34247A] dark:group-hover:text-[#7C5DFA] transition-colors">{project.name}</h3>
                        {project.id === selectedProjectId && (
                          <span className="text-[10px] font-bold text-[#34247A] dark:text-[#7C5DFA] uppercase tracking-wider">Active</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(project.id); setEditingName(project.name); }} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-[#34247A] dark:hover:text-[#7C5DFA] hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); void handleDelete(project.id); }} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Tasks</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{project.taskCount}</div>
                </div>
                <div className="bg-green-50/50 dark:bg-green-500/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-green-500 dark:text-green-400 mb-1">Done</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{project.doneCount}</div>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-500/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">Active</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{project.doingCount}</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">Progress</span>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    {project.taskCount > 0 ? Math.round((project.doneCount / project.taskCount) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#34247A] to-[#7C5DFA] rounded-full transition-all duration-500"
                    style={{ width: `${project.taskCount > 0 ? (project.doneCount / project.taskCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {projectStats.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <FolderKanban size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-semibold">No projects yet</p>
              <p className="text-sm mt-1">Create your first project to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
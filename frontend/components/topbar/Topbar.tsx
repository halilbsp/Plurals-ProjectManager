"use client";
/* eslint-disable @next/next/no-img-element */

import {
  Bell,
  Check,
  ChevronDown,
  Edit3,
  FolderKanban,
  MessageSquare,
  AlertCircle,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
  Zap,
  CheckSquare,
  ArrowRight,
  LogOut,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  createProject,
  deleteProject,
  updateProject,
} from "@/api/project";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "@/api/notification";
import { api } from "@/api/api";
import { useProjectContext } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const notificationIcons: Record<string, typeof Bell> = {
  broadcast: MessageSquare,
  task: AlertCircle,
  system: Zap,
};

interface SearchResult {
  projects: {
    id: number;
    name: string;
    type: string;
  }[];
  tasks: {
    id: number;
    title: string;
    status: string;
    priority: string;
    project_id: number;
    type: string;
  }[];
}

/* ── Tab definitions ── */
const topTabs = [
  { id: "workspace", label: "Workspace", href: "/" },
  { id: "tasks", label: "Tasks", href: "/tasks" },
  { id: "document", label: "Document", href: "/project" },
];

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    selectedProjectId,
    setSelectedProjectId,
    projects,
    isLoadingProjects,
    reloadProjects,
  } = useProjectContext();

  /* ── Project Dropdown State ── */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Notification State ── */
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedNotifId, setExpandedNotifId] = useState<number | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  /* ── Search State ── */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult>({
    projects: [],
    tasks: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  /* ── Profile Dropdown State ── */
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  /* ── Close panels on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setIsCreating(false);
        setEditingId(null);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setExpandedNotifId(null);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Keyboard shortcut ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setDropdownOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ── Debounced Search ── */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ projects: [], tasks: [] });
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get<SearchResult>("/search", { params: { q: searchQuery } });
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  /* ── Load notifications (user.id ile filtreleme) ── */
  const loadNotifications = useCallback(async () => {
    try {
      const userId = user?.id;
      const [items, count] = await Promise.all([
        getNotifications(10, userId),
        getUnreadCount(userId),
      ]);
      setNotifications(items);
      setUnreadCount(count.count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 15000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  /* ── Reset expanded notification when panel closes ── */
  useEffect(() => {
    if (!notifOpen) {
      setExpandedNotifId(null);
    }
  }, [notifOpen]);

  /* ── Project handlers ── */
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

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
      console.error("Failed to rename project:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(id);
      await reloadProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  /* ── Notification handlers ── */
  const handleMarkRead = async (id: number) => {
    try {
      await markAsRead(id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  /* ── Mark All Read (user.id ile filtreleme) ── */
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(user?.id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotifClick = (notif: Notification) => {
    if (expandedNotifId === notif.id) {
      setExpandedNotifId(null);
    } else {
      setExpandedNotifId(notif.id);
    }
    if (notif.is_read === 0) {
      void handleMarkRead(notif.id);
    }
  };

  /* ── Search handlers ── */
  const handleSearchProjectClick = (projectId: number) => {
    setSelectedProjectId(projectId);
    setSearchOpen(false);
    setSearchQuery("");
    router.push("/");
  };

  const handleSearchTaskClick = (projectId: number) => {
    setSelectedProjectId(projectId);
    setSearchOpen(false);
    setSearchQuery("");
    router.push("/tasks");
  };

  /* ── Profile handlers ── */
  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    router.push("/login");
  };

  /* ── Active tab helper ── */
  const getActiveTab = () => {
    if (pathname === "/tasks") return "tasks";
    if (pathname === "/project") return "document";
    return "workspace";
  };

  const activeTab = getActiveTab();

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const totalResults = searchResults.projects.length + searchResults.tasks.length;

  const priorityColor: Record<string, string> = {
    high: "text-red-500 bg-red-50 dark:bg-red-500/10",
    medium: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
    low: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  };

  return (
    <header className="h-[72px] bg-white dark:bg-[#1A1530] border-b border-gray-100 dark:border-white/10 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
      {/* Left Tabs */}
      <div className="flex items-center gap-1 font-medium text-[15px]">
        {topTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => router.push(tab.href)}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === tab.id
                ? "text-black dark:text-white bg-gray-100/80 dark:bg-white/10 shadow-sm font-semibold"
                : "text-gray-400 dark:text-gray-500 font-medium hover:text-black dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* ── Search ── */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              setDropdownOpen(false);
              setNotifOpen(false);
              setProfileOpen(false);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-gray-400 dark:text-gray-500 hover:border-[#34247A] dark:hover:border-[#7C5DFA] transition-all"
          >
            <Search size={16} />
            <span className="text-sm font-medium hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline text-[10px] font-bold bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md ml-2">
              ⌘K
            </kbd>
          </button>

          {searchOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[420px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(52,36,122,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-white/5">
                <Search size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects and tasks..."
                  className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {!searchQuery.trim() && (
                  <div className="text-center py-10">
                    <Search size={32} className="text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Type to search projects and tasks</p>
                  </div>
                )}

                {searchQuery.trim() && isSearching && (
                  <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">Searching...</div>
                )}

                {searchQuery.trim() && !isSearching && totalResults === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      No results for &ldquo;<span className="font-semibold text-gray-600 dark:text-gray-300">{searchQuery}</span>&rdquo;
                    </p>
                  </div>
                )}

                {searchResults.projects.length > 0 && (
                  <div>
                    <div className="px-5 pt-3 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Projects</span>
                    </div>
                    {searchResults.projects.map((p) => (
                      <div key={`project-${p.id}`} onClick={() => handleSearchProjectClick(p.id)} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                          <FolderKanban size={16} className="text-[#34247A] dark:text-[#7C5DFA]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.name}</span>
                        </div>
                        <ArrowRight size={14} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.tasks.length > 0 && (
                  <div>
                    <div className="px-5 pt-3 pb-1.5 border-t border-gray-50 dark:border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Tasks</span>
                    </div>
                    {searchResults.tasks.map((t) => (
                      <div key={`task-${t.id}`} onClick={() => handleSearchTaskClick(t.project_id)} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                          <CheckSquare size={16} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{t.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityColor[t.priority] || priorityColor.medium}`}>{t.priority}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{t.status}</span>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {totalResults > 0 && (
                <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5 text-center">
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{totalResults} result{totalResults > 1 ? "s" : ""} found</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Project Switcher ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setIsCreating(false);
              setEditingId(null);
              setNotifOpen(false);
              setSearchOpen(false);
              setProfileOpen(false);
            }}
            disabled={isLoadingProjects}
            className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl px-4 py-2.5 shadow-sm outline-none transition-all hover:border-[#34247A] dark:hover:border-[#7C5DFA] focus:border-[#34247A]"
          >
            <FolderKanban size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="max-w-[180px] truncate">
              {isLoadingProjects ? "Loading..." : selectedProject?.name ?? "Select Project"}
            </span>
            <ChevronDown size={16} className={`text-gray-400 dark:text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(52,36,122,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Your Projects</span>
                <button onClick={() => { setIsCreating(true); setEditingId(null); }} className="flex items-center gap-1 text-[11px] font-bold text-[#34247A] dark:text-[#7C5DFA] hover:text-[#7C5DFA] transition-colors uppercase tracking-wider">
                  <Plus size={14} />
                  New
                </button>
              </div>

              {isCreating && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1">
                    <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); if (e.key === "Escape") setIsCreating(false); }} placeholder="Project name..." className="flex-1 bg-transparent text-sm px-2 py-1.5 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                    <button onClick={() => void handleCreate()} className="px-3 py-1.5 bg-[#34247A] text-white text-xs font-bold rounded-lg hover:bg-[#2A1D63] transition-colors">Add</button>
                    <button onClick={() => { setIsCreating(false); setNewName(""); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="max-h-[280px] overflow-y-auto px-2 pb-3">
                {projects.map((project) => (
                  <div key={project.id} className="group">
                    {editingId === project.id ? (
                      <div className="flex items-center gap-2 mx-2 my-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1">
                        <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleRename(project.id); if (e.key === "Escape") setEditingId(null); }} className="flex-1 bg-transparent text-sm px-2 py-1.5 outline-none text-gray-700 dark:text-gray-200" />
                        <button onClick={() => void handleRename(project.id)} className="px-3 py-1.5 bg-[#34247A] text-white text-xs font-bold rounded-lg hover:bg-[#2A1D63] transition-colors">Save</button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className={`flex items-center justify-between px-3 py-2.5 mx-1 rounded-xl cursor-pointer transition-all ${project.id === selectedProjectId ? "bg-[#34247A]/5 dark:bg-[#7C5DFA]/10 border border-[#34247A]/10 dark:border-[#7C5DFA]/20" : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => { setSelectedProjectId(project.id); setDropdownOpen(false); }}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${project.id === selectedProjectId ? "bg-[#34247A] text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"}`}>
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-sm font-semibold truncate ${project.id === selectedProjectId ? "text-[#34247A] dark:text-[#7C5DFA]" : "text-gray-700 dark:text-gray-300"}`}>
                            {project.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(project.id); setEditingName(project.name); setIsCreating(false); }} className="p-1.5 text-gray-400 hover:text-[#34247A] dark:hover:text-[#7C5DFA] hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors">
                            <Edit3 size={13} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); void handleDelete(project.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {projects.length === 0 && !isLoadingProjects && (
                  <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">No projects yet. Create your first one!</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Theme Toggle ── */}
        <button
          type="button"
          onClick={toggleTheme}
          className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors p-2 cursor-pointer"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
        </button>

        {/* Settings */}
        <button type="button" className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors p-2 cursor-pointer" onClick={() => router.push("/settings")}>
          <Settings size={20} strokeWidth={2.5} />
        </button>

        {/* ── Notification Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors relative p-2 cursor-pointer mr-2"
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); setSearchOpen(false); setProfileOpen(false); }}
          >
            <Bell size={20} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full border-2 border-white dark:border-[#1A1530] text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[400px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(52,36,122,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-gray-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-50 dark:bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={() => void handleMarkAllRead()} className="flex items-center gap-1 text-[11px] font-bold text-[#34247A] dark:text-[#7C5DFA] hover:text-[#7C5DFA] transition-colors uppercase tracking-wider">
                    <Check size={13} />
                    Read All
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">No notifications yet.</div>
                )}
                {notifications.map((notif) => {
                  const Icon = notificationIcons[notif.type] || Bell;
                  const isExpanded = expandedNotifId === notif.id;
                  const hasSender = notif.sender_name && notif.sender_name.trim() !== "";
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-all duration-200 border-b border-gray-50 dark:border-white/5 last:border-b-0 ${
                        notif.is_read === 0
                          ? "bg-purple-50/30 dark:bg-purple-500/5 hover:bg-purple-50/50 dark:hover:bg-purple-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {/* Sender Avatar or Icon */}
                      {hasSender && notif.sender_avatar ? (
                        <img
                          src={notif.sender_avatar}
                          alt={notif.sender_name}
                          className="w-9 h-9 rounded-xl object-cover flex-shrink-0 mt-0.5"
                        />
                      ) : hasSender ? (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                          notif.is_read === 0
                            ? "bg-[#34247A] dark:bg-[#7C5DFA] text-white"
                            : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                        }`}>
                          {notif.sender_name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${
                          notif.is_read === 0
                            ? "bg-[#34247A]/10 dark:bg-[#7C5DFA]/10 text-[#34247A] dark:text-[#7C5DFA]"
                            : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"
                        }`}>
                          <Icon size={16} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Title row with sender name */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className={`text-[13px] font-semibold truncate ${
                              notif.is_read === 0
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {notif.title}
                            </h4>
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatTime(notif.created_at)}
                          </span>
                        </div>

                        {/* Sender info */}
                        {hasSender && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-semibold text-[#34247A] dark:text-[#7C5DFA]">
                              {notif.sender_name}
                            </span>
                            <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                              {notif.type}
                            </span>
                          </div>
                        )}

                        {/* Message */}
                        <p
                          className={`text-[12px] text-gray-500 dark:text-gray-400 mt-1 transition-all duration-200 ${
                            isExpanded
                              ? "whitespace-pre-wrap break-words"
                              : "truncate"
                          }`}
                        >
                          {notif.message}
                        </p>

                        {/* Expand/Collapse hint */}
                        {notif.message && notif.message.length > 45 && (
                          <span className="text-[10px] font-semibold text-[#34247A] dark:text-[#7C5DFA] mt-1 inline-block">
                            {isExpanded ? "Show less" : "Show more"}
                          </span>
                        )}
                      </div>

                      {notif.is_read === 0 && (
                        <div className="w-2 h-2 rounded-full bg-[#34247A] dark:bg-[#7C5DFA] mt-2 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Profile Dropdown ── */}
        <div className="relative" ref={profileRef}>
          <div
            className="flex items-center gap-3 pl-5 border-l border-gray-100 dark:border-white/10 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => {
              setProfileOpen(!profileOpen);
              setDropdownOpen(false);
              setNotifOpen(false);
              setSearchOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setProfileOpen(!profileOpen);
            }}
          >
            <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center overflow-hidden">
              <img src={user?.avatar || "https://i.pravatar.cc/150?u=arshakir"} alt={user?.name || "User"} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-[15px] text-gray-800 dark:text-gray-100">{user?.name || "User"}</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{selectedProject?.name ?? user?.role ?? "Member"}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 dark:text-gray-500 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                strokeWidth={3}
              />
            </div>
          </div>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(52,36,122,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              {/* User Info */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img src={user?.avatar || "https://i.pravatar.cc/150?u=arshakir"} alt={user?.name || "User"} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || "User"}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.email || ""}</div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1.5">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <User size={16} className="text-gray-400 dark:text-gray-500" />
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Settings size={16} className="text-gray-400 dark:text-gray-500" />
                  Preferences
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-50 dark:border-white/5 py-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
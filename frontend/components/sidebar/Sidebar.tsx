"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  PieChart,
  Plus,
  Settings,
  Settings2,
} from "lucide-react";

import { useProjectContext } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { getTasks } from "@/api/task";
import { getUserWorkspaces, switchWorkspace, createWorkspace } from "@/api/workspace";
import { useCallback, useEffect, useState, useRef } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/project", label: "Project", icon: FolderKanban },
  { href: "/tasks", label: "Task list", icon: CheckSquare, hasBadge: true },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/activity", label: "Activity", icon: Activity },
];

const bottomItems = [
  { href: "/settings", label: "Setting", icon: Settings },
  { href: "/support", label: "Support", icon: HelpCircle },
];

interface WorkspaceItem {
  id: number;
  name: string;
  owner_id: number;
  member_count: number;
  role: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedProjectId } = useProjectContext();
  const { user, activeWorkspace, logout, setActiveWorkspace } = useAuth();
  const [taskCount, setTaskCount] = useState(0);

  // Workspace dropdown
  const [wsOpen, setWsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [showNewWs, setShowNewWs] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [wsLoading, setWsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const tasks = await getTasks(selectedProjectId);
        setTaskCount(tasks.length);
      } catch {
        setTaskCount(0);
      }
    };
    void loadCount();
  }, [selectedProjectId]);

  // Load workspaces when dropdown opens
  const loadWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserWorkspaces(user.id);
      setWorkspaces(data);
    } catch {
      setWorkspaces([]);
    }
  }, [user]);

  useEffect(() => {
    if (wsOpen && user) {
      void loadWorkspaces();
    }
  }, [wsOpen, user, loadWorkspaces]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWsOpen(false);
        setShowNewWs(false);
        setNewWsName("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchWorkspace = async (ws: WorkspaceItem) => {
    if (!user || ws.id === activeWorkspace?.id) {
      setWsOpen(false);
      return;
    }
    try {
      await switchWorkspace(user.id, ws.id);
      setActiveWorkspace({ id: ws.id, name: ws.name, owner_id: ws.owner_id });
      setWsOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Failed to switch workspace:", err);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!user || !newWsName.trim()) return;
    setWsLoading(true);
    try {
      const created = await createWorkspace(user.id, newWsName.trim());
      setActiveWorkspace({ id: created.id, name: created.name, owner_id: user.id });
      setNewWsName("");
      setShowNewWs(false);
      setWsOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setWsLoading(false);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const renderLink = (item: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    hasBadge?: boolean;
  }) => {
    const active = isActive(item.href);

    return (
      <li key={item.label}>
        <Link href={item.href}>
          <div
            className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
              active
                ? "bg-white/10 text-white font-medium shadow-sm"
                : "text-purple-200 hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              {item.label}
            </div>
            {item.hasBadge && taskCount > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {taskCount}
              </span>
            )}
          </div>
        </Link>
      </li>
    );
  };

  return (
    <div className="w-64 h-screen bg-[#34247A] text-white flex flex-col justify-between overflow-y-auto custom-scrollbar">
      <div>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 text-2xl font-bold tracking-wide">
          <Settings2 size={26} className="text-white" />
          <span>Plurals</span>
        </div>

        {/* Workspace Switcher */}
        <div className="px-4 mb-4" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setWsOpen(!wsOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3CE0D0] to-[#7C5CFC] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {activeWorkspace?.name?.charAt(0)?.toUpperCase() || "W"}
              </div>
              <span className="text-sm font-medium truncate">
                {activeWorkspace?.name || "Workspace"}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-purple-300 shrink-0 transition-transform ${wsOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {wsOpen && (
            <div className="mt-1.5 bg-[#1C1242] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 relative">
              <div className="px-3 py-2 border-b border-white/5">
                <span className="text-[10px] font-semibold text-purple-300/60 uppercase tracking-widest">
                  Workspaces
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSwitchWorkspace(ws)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#3CE0D0] to-[#7C5CFC] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm text-white truncate max-w-[140px]">
                          {ws.name}
                        </span>
                        <span className="text-[10px] text-purple-300/50">
                          {ws.member_count} member{ws.member_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {activeWorkspace?.id === ws.id && (
                      <Check size={14} className="text-[#3CE0D0] shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-white/5">
                {showNewWs ? (
                  <div className="p-2.5 flex gap-2">
                    <input
                      type="text"
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                      placeholder="Workspace name"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-purple-300/40 focus:outline-none focus:border-[#3CE0D0]/50"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateWorkspace}
                      disabled={wsLoading || !newWsName.trim()}
                      className="bg-[#3CE0D0] hover:bg-[#2bc4b5] text-black font-semibold rounded-lg px-3 py-1.5 text-xs disabled:opacity-40 transition-colors"
                    >
                      {wsLoading ? "..." : "Add"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewWs(true)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-purple-200 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                    New Workspace
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 mt-2 text-xs font-semibold text-purple-200/50 uppercase tracking-widest mb-3">
          Menu
        </div>

        {/* Nav Items */}
        <ul className="space-y-1 px-4">
          {navItems.map(renderLink)}

          <div className="my-4 mx-4 border-t border-white/5" />

          {bottomItems.map(renderLink)}
        </ul>
      </div>

      {/* Bottom Section */}
      <div className="px-4 pb-6 mt-4">
        <div className="px-1 py-2 mb-2">
          <button
            type="button"
            className="w-full text-left flex items-center gap-3 p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/5 transition-colors"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="bg-[#1C1242] rounded-[20px] p-5 relative overflow-hidden shadow-lg mt-2">
          <div className="absolute top-0 right-0 p-2 opacity-[0.15]">
            <Lock
              size={64}
              className="text-white -mr-4 -mt-4 rotate-[15deg]"
            />
          </div>

          <div className="relative z-10 flex flex-col">
            <Lock size={20} className="text-white mb-2" />
            <h4 className="text-lg font-bold text-white leading-tight mb-1 tracking-wide">
              Upgrade to
              <br />
              Premium
            </h4>
            <div className="text-[11px] text-purple-300/80 mb-4 leading-relaxed font-medium">
              Go Pro to unlock all
              <br />
              features
            </div>
            <button
              type="button"
              className="w-full bg-[#3CE0D0] hover:bg-[#2bc4b5] transition-colors text-black font-semibold rounded-lg py-2.5 text-sm shadow-md"
              onClick={() => window.alert("Upgrade action was triggered.")}
            >
              Upgrade now!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

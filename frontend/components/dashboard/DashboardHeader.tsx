"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";

import { getDashboardSummary, type DashboardSummary } from "@/api/dashboard";
import {
  getProjectMembers,
  getUsers,
  addMemberToProject,
  removeMemberFromProject,
  type ProjectMember,
  type User,
} from "@/api/user";
import { useProjectContext } from "@/context/ProjectContext";

const fallbackSummary: DashboardSummary = {
  project_id: 1,
  project_name: "ARS - Design Team",
  project_description:
    "This project is focused on shipping an ambitious product with a fast-moving design team and a premium visual direction.",
  main_task_title: "Design Project",
  main_task_status: "In Progress",
  tasks_count: 24,
  logged_hours: 190,
};

export default function DashboardHeader() {
  const { selectedProjectId } = useProjectContext();
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getDashboardSummary(selectedProjectId);
        setSummary(data);
      } catch (error) {
        console.error("Dashboard header could not be loaded:", error);
      }
    };
    void loadSummary();
  }, [selectedProjectId]);

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const [membersData, usersData] = await Promise.all([
          getProjectMembers(selectedProjectId),
          getUsers(),
        ]);
        setMembers(membersData);
        setAllUsers(usersData);
      } catch (error) {
        console.error("Members could not be loaded:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    void loadMembers();
  }, [selectedProjectId]);

  const handleAddMember = async (userId: number) => {
    try {
      await addMemberToProject(selectedProjectId, userId);
      const updated = await getProjectMembers(selectedProjectId);
      setMembers(updated);
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMemberFromProject(selectedProjectId, userId);
      const updated = await getProjectMembers(selectedProjectId);
      setMembers(updated);
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const memberUserIds = members.map((m) => m.user_id);
  const nonMembers = allUsers.filter((u) => !memberUserIds.includes(u.id));
  const visibleMembers = members.slice(0, 4);
  const extraCount = Math.max(0, members.length - 4);

  return (
    <div className="flex items-start justify-between w-full mb-8">
      <div className="max-w-xl">
        <h1 className="text-[28px] font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
          {summary.project_name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-[14px] leading-relaxed">
          {summary.project_description}
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 relative">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wide">
          Members
        </span>
        <div className="flex items-center gap-5">
          {/* Avatars */}
          <div className="flex -space-x-2">
            {isLoadingMembers
              ? [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-[3px] border-white dark:border-[#1A1530] bg-gray-100 dark:bg-white/10 shadow-sm animate-pulse"
                    style={{ zIndex: 10 - i }}
                  />
                ))
              : visibleMembers.map((member, index) => (
                  <div key={member.id} className="relative group/avatar">
                    <img
                      className="w-10 h-10 rounded-full border-[3px] border-white dark:border-[#1A1530] object-cover shadow-sm"
                      style={{ zIndex: 10 - index }}
                      src={member.user.avatar || `https://i.pravatar.cc/150?u=${member.user.email}`}
                      alt={member.user.name}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {member.user.name}
                      <span className="text-gray-400 dark:text-gray-300 ml-1">
                        · {member.user.role}
                      </span>
                    </div>
                  </div>
                ))}

            {extraCount > 0 && (
              <div className="w-10 h-10 rounded-full border-[3px] border-white dark:border-[#1A1530] bg-gray-50 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 relative z-0 shadow-sm">
                +{extraCount}
              </div>
            )}
          </div>

          {/* Invite Button */}
          <button
            type="button"
            className="flex items-center gap-2 bg-[#34247A] hover:bg-[#2A1D63] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md active:scale-95"
            onClick={() => setShowInvite(!showInvite)}
          >
            <UserPlus size={18} />
            Invite
          </button>
        </div>

        {/* Invite Dropdown */}
        {showInvite && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(52,36,122,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50">
            {/* Current Members */}
            <div className="px-5 pt-4 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                Current Members ({members.length})
              </span>
            </div>
            <div className="max-h-[160px] overflow-y-auto px-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 group"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.user.avatar || `https://i.pravatar.cc/150?u=${member.user.email}`}
                      alt={member.user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {member.user.name}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        {member.user.role}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleRemoveMember(member.user_id)}
                    className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Available Users */}
            {nonMembers.length > 0 && (
              <>
                <div className="px-5 pt-3 pb-2 border-t border-gray-50 dark:border-white/5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                    Add Members
                  </span>
                </div>
                <div className="max-h-[140px] overflow-y-auto px-3 pb-3">
                  {nonMembers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                      onClick={() => void handleAddMember(user.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            {user.role}
                          </div>
                        </div>
                      </div>
                      <div className="p-1 text-gray-300 dark:text-gray-600 hover:text-green-500">
                        <UserPlus size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {nonMembers.length === 0 && (
              <div className="px-5 py-4 border-t border-gray-50 dark:border-white/5 text-center text-xs text-gray-400 dark:text-gray-500">
                All users are already members.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
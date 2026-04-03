"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useRef } from "react";
import {
  ChevronDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  Users,
  Globe,
  UserCheck,
  Check,
} from "lucide-react";

import { createNotification, createBulkNotifications } from "@/api/notification";
import {
  getProjectMembers,
  getUsers,
  addMemberToProject,
  removeMemberFromProject,
  type ProjectMember,
  type User,
} from "@/api/user";
import { useProjectContext } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";

const emojiSets = [
  ["😲", "😆", "🤦", "👧", "😜", "😆", "🔥", "🎉"],
  ["👍", "❤️", "🚀", "💯", "✨", "🎯", "💪", "🙌"],
  ["😎", "🤩", "😂", "🥳", "👏", "💡", "⭐", "🏆"],
];

const chipColors = [
  "bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
  "bg-green-50/50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20",
];

type AudienceMode = "everyone" | "team" | "specific";

export default function BroadcastCard() {
  const { selectedProjectId } = useProjectContext();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [emojiPage, setEmojiPage] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  /* ── Audience Dropdown State ── */
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("everyone");
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const audienceRef = useRef<HTMLDivElement>(null);
  const userPickerRef = useRef<HTMLDivElement>(null);

  const currentEmojis = emojiSets[emojiPage];

  /* ── Sender info from auth ── */
  const senderId = user?.id ?? null;
  const senderName = user?.name ?? "Unknown";
  const senderAvatar = user?.avatar ?? "";

  useEffect(() => {
    const load = async () => {
      try {
        const [m, u] = await Promise.all([
          getProjectMembers(selectedProjectId),
          getUsers(),
        ]);
        setMembers(m);
        setAllUsers(u);
      } catch (err) {
        console.error("Failed to load collaborators:", err);
      }
    };
    void load();
  }, [selectedProjectId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
      if (audienceRef.current && !audienceRef.current.contains(e.target as Node)) {
        setAudienceOpen(false);
      }
      if (userPickerRef.current && !userPickerRef.current.contains(e.target as Node)) {
        setUserPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const memberUserIds = members.map((m) => m.user_id);
  const nonMembers = allUsers.filter((u) => !memberUserIds.includes(u.id));

  const visibleMembers = members.slice(0, 2);
  const extraCount = Math.max(0, members.length - 2);

  const handleAddMember = async (userId: number) => {
    try {
      await addMemberToProject(selectedProjectId, userId);
      const updated = await getProjectMembers(selectedProjectId);
      setMembers(updated);
      setShowPicker(false);
    } catch (err) {
      console.error("Failed to add collaborator:", err);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMemberFromProject(selectedProjectId, userId);
      const updated = await getProjectMembers(selectedProjectId);
      setMembers(updated);
    } catch (err) {
      console.error("Failed to remove collaborator:", err);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setSent(false);
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAudience = (mode: AudienceMode) => {
    setAudienceMode(mode);
    setAudienceOpen(false);
    if (mode !== "specific") {
      setSelectedUserIds([]);
      setUserPickerOpen(false);
    } else {
      setTimeout(() => setUserPickerOpen(true), 100);
    }
  };

  const buildPayload = (targetUserId: number | null) => ({
    title: "New Broadcast",
    message: message.trim(),
    type: "broadcast",
    project_id: selectedProjectId,
    target_user_id: targetUserId,
    sender_id: senderId,
    sender_name: senderName,
    sender_avatar: senderAvatar,
  });

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      if (audienceMode === "everyone") {
        await createNotification(buildPayload(null));
      } else if (audienceMode === "team") {
        if (members.length > 0) {
          const payloads = members.map((m) => buildPayload(m.user_id));
          await createBulkNotifications(payloads);
        } else {
          await createNotification(buildPayload(null));
        }
      } else if (audienceMode === "specific") {
        if (selectedUserIds.length > 0) {
          const payloads = selectedUserIds.map((uid) => buildPayload(uid));
          await createBulkNotifications(payloads);
        }
      }

      setSent(true);
      setMessage("");
      setSelectedUserIds([]);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("Failed to send broadcast:", err);
    } finally {
      setIsSending(false);
    }
  };

  const getAudienceLabel = () => {
    if (audienceMode === "everyone") return "Everyone";
    if (audienceMode === "team") return "Team Only";
    if (audienceMode === "specific" && selectedUserIds.length > 0) {
      return `${selectedUserIds.length} User${selectedUserIds.length > 1 ? "s" : ""}`;
    }
    return "Select Users";
  };

  const isSendDisabled =
    isSending ||
    !message.trim() ||
    (audienceMode === "specific" && selectedUserIds.length === 0);

  const selectedUsers = allUsers.filter((u) => selectedUserIds.includes(u.id));
  const visibleSelectedUsers = selectedUsers.slice(0, 3);
  const extraSelectedCount = Math.max(0, selectedUsers.length - 3);

  return (
    <div className="bg-white dark:bg-[#1A1530] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-white/10 flex flex-col h-[400px] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-[16px]">New Broadcast</h2>

        {/* Audience Dropdown */}
        <div className="relative" ref={audienceRef}>
          <button
            onClick={() => setAudienceOpen(!audienceOpen)}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors"
          >
            <span className="font-medium text-[13px]">{getAudienceLabel()}</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${audienceOpen ? "rotate-180" : ""}`}
            />
          </button>

          {audienceOpen && (
            <div className="absolute right-0 top-[calc(100%+4px)] w-[190px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-[0_12px_40px_rgba(52,36,122,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-1">
              <button
                onClick={() => handleSelectAudience("everyone")}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                  audienceMode === "everyone"
                    ? "text-[#34247A] dark:text-[#7C5DFA] bg-purple-50/50 dark:bg-purple-500/10 font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <Globe
                  size={15}
                  className={
                    audienceMode === "everyone"
                      ? "text-[#34247A] dark:text-[#7C5DFA]"
                      : "text-gray-400 dark:text-gray-500"
                  }
                />
                Everyone
              </button>
              <button
                onClick={() => handleSelectAudience("team")}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                  audienceMode === "team"
                    ? "text-[#34247A] dark:text-[#7C5DFA] bg-purple-50/50 dark:bg-purple-500/10 font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <Users
                  size={15}
                  className={
                    audienceMode === "team"
                      ? "text-[#34247A] dark:text-[#7C5DFA]"
                      : "text-gray-400 dark:text-gray-500"
                  }
                />
                Team Only
              </button>

              <div className="border-t border-gray-50 dark:border-white/5 my-1" />

              <button
                onClick={() => handleSelectAudience("specific")}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                  audienceMode === "specific"
                    ? "text-[#34247A] dark:text-[#7C5DFA] bg-purple-50/50 dark:bg-purple-500/10 font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <UserCheck
                  size={15}
                  className={
                    audienceMode === "specific"
                      ? "text-[#34247A] dark:text-[#7C5DFA]"
                      : "text-gray-400 dark:text-gray-500"
                  }
                />
                Specific Users
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Users Chips (when specific mode) */}
      {audienceMode === "specific" && selectedUsers.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {visibleSelectedUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-1.5 bg-purple-50/50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-full py-0.5 pl-0.5 pr-2"
            >
              <img
                src={u.avatar || `https://i.pravatar.cc/150?u=${u.email}`}
                className="w-5 h-5 rounded-full object-cover"
                alt={u.name}
              />
              <span className="text-[11px] font-semibold text-[#34247A] dark:text-[#7C5DFA]">
                {u.name.split(" ")[0]}
              </span>
              <button
                onClick={() => toggleUserSelection(u.id)}
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {extraSelectedCount > 0 && (
            <span className="text-[10px] font-bold text-[#34247A] dark:text-[#7C5DFA] bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded-full">
              +{extraSelectedCount}
            </span>
          )}
          <div className="relative" ref={userPickerRef}>
            <button
              onClick={() => setUserPickerOpen(!userPickerOpen)}
              className="w-5 h-5 rounded-full border border-dashed border-purple-300 dark:border-purple-500/40 flex items-center justify-center text-[#34247A] dark:text-[#7C5DFA] hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
            >
              <Plus size={10} />
            </button>

            {userPickerOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-[220px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-[0_12px_40px_rgba(52,36,122,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-50 dark:border-white/5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                    Select Recipients
                  </span>
                </div>
                <div className="max-h-[180px] overflow-y-auto px-1.5 py-1">
                  {allUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUserSelection(u.id)}
                        className={`flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-purple-50/50 dark:bg-purple-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <img
                          src={u.avatar || `https://i.pravatar.cc/150?u=${u.email}`}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 truncate">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            {u.role}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#34247A] dark:bg-[#7C5DFA] border-[#34247A] dark:border-[#7C5DFA]"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specific Users Picker Button (when no users selected yet) */}
      {audienceMode === "specific" && selectedUsers.length === 0 && (
        <div className="mb-3 relative" ref={userPickerRef}>
          <button
            onClick={() => setUserPickerOpen(!userPickerOpen)}
            className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-purple-200 dark:border-purple-500/30 rounded-xl text-[12px] font-semibold text-[#34247A] dark:text-[#7C5DFA] hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-colors"
          >
            <UserCheck size={14} />
            Click to select recipients...
          </button>

          {userPickerOpen && (
            <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-[0_12px_40px_rgba(52,36,122,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-50 dark:border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                  Select Recipients
                </span>
              </div>
              <div className="max-h-[160px] overflow-y-auto px-1.5 py-1">
                {allUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-purple-50/50 dark:bg-purple-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <img
                        src={u.avatar || `https://i.pravatar.cc/150?u=${u.email}`}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                          {u.role}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#34247A] dark:bg-[#7C5DFA] border-[#34247A] dark:border-[#7C5DFA]"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <div>
          <label className="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSent(false);
            }}
            placeholder="Type your broadcast message..."
            className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-3 h-[72px] w-full text-sm text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 focus:ring-purple-200 dark:focus:ring-purple-500/30 focus:border-purple-200 dark:focus:border-purple-500/30 transition-shadow outline-none resize-none"
          />
        </div>

        {/* Emojis */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() =>
              setEmojiPage((prev) => (prev === 0 ? emojiSets.length - 1 : prev - 1))
            }
            className="text-blue-500 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full p-0.5 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3 text-[18px]">
            {currentEmojis.map((emoji, i) => (
              <span
                key={`${emojiPage}-${i}`}
                className="cursor-pointer hover:scale-125 transition-transform"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </span>
            ))}
          </div>
          <button
            onClick={() =>
              setEmojiPage((prev) => (prev === emojiSets.length - 1 ? 0 : prev + 1))
            }
            className="text-blue-500 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full p-0.5 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={() => void handleSend()}
          disabled={isSendDisabled}
          className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.97] ${
            sent
              ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20"
              : "bg-[#34247A] hover:bg-[#2A1D63] text-white shadow-md shadow-purple-900/10 disabled:opacity-50"
          }`}
        >
          {sent ? (
            <>✅ Broadcast Sent!</>
          ) : (
            <>
              <Send size={15} />
              {isSending
                ? "Sending..."
                : audienceMode === "specific" && selectedUserIds.length > 0
                ? `Send to ${selectedUserIds.length} User${selectedUserIds.length > 1 ? "s" : ""}`
                : "Send Broadcast"}
            </>
          )}
        </button>
      </div>

      {/* Add Collaborators */}
      <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/5 flex-shrink-0">
        <label className="text-gray-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2 block">
          Add Collaborators
        </label>
        <div className="flex items-center gap-2">
          {visibleMembers.map((member, index) => (
            <div
              key={member.id}
              className={`flex items-center gap-1.5 ${chipColors[index % chipColors.length]} rounded-full py-1 pl-1 pr-2.5 border`}
            >
              <img
                src={member.user.avatar || `https://i.pravatar.cc/150?u=${member.user.email}`}
                className="w-6 h-6 rounded-full object-cover"
                alt={member.user.name}
              />
              <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200">
                {member.user.name.split(" ")[0]}
              </span>
              <button
                onClick={() => void handleRemoveMember(member.user_id)}
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {extraCount > 0 && (
            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">
              +{extraCount}
            </span>
          )}

          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-7 h-7 rounded-full border-2 border-dashed border-gray-200 dark:border-white/20 flex items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:border-[#34247A] dark:hover:border-[#7C5DFA] hover:text-[#34247A] dark:hover:text-[#7C5DFA] transition-colors"
            >
              <Plus size={14} />
            </button>

            {showPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-white dark:bg-[#1E1A2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-[0_12px_40px_rgba(52,36,122,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                <div className="px-3 pt-2.5 pb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                    Add Member
                  </span>
                </div>

                <div className="max-h-[150px] overflow-y-auto px-1.5 pb-1.5">
                  {nonMembers.length === 0 && (
                    <div className="text-center py-3 text-[11px] text-gray-400 dark:text-gray-500">
                      All users added.
                    </div>
                  )}

                  {nonMembers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => void handleAddMember(u.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <img
                        src={u.avatar || `https://i.pravatar.cc/150?u=${u.email}`}
                        alt={u.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 truncate">
                        {u.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 ml-0.5" />
          <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
      </div>
    </div>
  );
}
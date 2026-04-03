"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useCallback } from "react";
import {
  X,
  CheckCircle2,
  BarChart2,
  Calendar,
  AlignLeft,
  Trash2,
  MessageSquare,
  ListChecks,
  Tag,
  Plus,
  Send,
  Square,
  CheckSquare,
  UserCircle,
} from "lucide-react";

import {
  updateTask,
  deleteTask,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from "@/api/task";
import {
  getComments,
  addComment,
  deleteComment,
  getSubtasks,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  getTags,
  addTag,
  deleteTag,
  type TaskComment,
  type Subtask,
  type TaskTag,
} from "@/api/taskDetail";
import { getProjectMembers, type ProjectMember } from "@/api/project";

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "doing", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const tagColors = [
  "#34247A", "#7C5DFA", "#22c55e", "#ef4444",
  "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6",
];

type ActiveTab = "comments" | "subtasks" | "tags";

export default function TaskModal({
  task,
  onClose,
  reload,
}: {
  task: Task;
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [assignedTo, setAssignedTo] = useState<number | null>(task.assigned_to ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>("comments");
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);

  const [commentText, setCommentText] = useState("");
  const [subtaskText, setSubtaskText] = useState("");
  const [tagText, setTagText] = useState("");
  const [tagColor, setTagColor] = useState(tagColors[0]);
  const [isSendingComment, setIsSendingComment] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loadDetails = useCallback(async () => {
    try {
      const [c, s, t] = await Promise.all([
        getComments(task.id),
        getSubtasks(task.id),
        getTags(task.id),
      ]);
      setComments(c);
      setSubtasks(s);
      setTags(t);
    } catch (err) {
      console.error("Failed to load task details:", err);
    }
  }, [task.id]);

  const loadMembers = useCallback(async () => {
    try {
      const m = await getProjectMembers(task.project_id);
      setMembers(m);
    } catch (err) {
      console.error("Failed to load project members:", err);
    }
  }, [task.project_id]);

  useEffect(() => {
    void loadDetails();
    void loadMembers();
  }, [loadDetails, loadMembers]);

  const assignedMember = members.find((m) => m.user_id === assignedTo);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTask(task.id, {
        title,
        description: description || null,
        status,
        priority,
        due_date: dueDate || null,
        assigned_to: assignedTo,
      });
      await reload();
      onClose();
    } catch (err) {
      console.error("Failed to save task:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      await reload();
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setIsSendingComment(true);
    try {
      await addComment(task.id, commentText.trim());
      setCommentText("");
      await loadDetails();
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    try { await deleteComment(id); await loadDetails(); } catch (err) { console.error("Failed to delete comment:", err); }
  };

  const handleAddSubtask = async () => {
    if (!subtaskText.trim()) return;
    try { await addSubtask(task.id, subtaskText.trim()); setSubtaskText(""); await loadDetails(); } catch (err) { console.error("Failed to add subtask:", err); }
  };

  const handleToggleSubtask = async (id: number) => {
    try { await toggleSubtask(id); await loadDetails(); } catch (err) { console.error("Failed to toggle subtask:", err); }
  };

  const handleDeleteSubtask = async (id: number) => {
    try { await deleteSubtask(id); await loadDetails(); } catch (err) { console.error("Failed to delete subtask:", err); }
  };

  const handleAddTag = async () => {
    if (!tagText.trim()) return;
    try { await addTag(task.id, tagText.trim(), tagColor); setTagText(""); await loadDetails(); } catch (err) { console.error("Failed to add tag:", err); }
  };

  const handleDeleteTag = async (id: number) => {
    try { await deleteTag(id); await loadDetails(); } catch (err) { console.error("Failed to delete tag:", err); }
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const doneCount = subtasks.filter((s) => s.is_done === 1).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const tabs: { id: ActiveTab; label: string; icon: typeof MessageSquare; count: number }[] = [
    { id: "comments", label: "Comments", icon: MessageSquare, count: comments.length },
    { id: "subtasks", label: "Checklist", icon: ListChecks, count: subtasks.length },
    { id: "tags", label: "Tags", icon: Tag, count: tags.length },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-[780px] max-h-[90vh] bg-white dark:bg-[#1A1530] rounded-[28px] shadow-[0_32px_100px_rgba(52,36,122,0.25)] dark:shadow-[0_32px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col transition-colors">
        {/* Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#34247A] via-[#7C5DFA] to-[#B794F4] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${status === "done" ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" : "bg-purple-50 dark:bg-purple-500/10 text-[#34247A] dark:text-[#7C5DFA]"}`}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Task Detail</span>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{task.id}</p>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 ml-3">
                {tags.map((tag) => (
                  <span key={tag.id} className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left – Content */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg font-bold text-gray-900 dark:text-white bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-[#34247A] dark:focus:border-[#7C5DFA] focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 rounded-xl px-3 py-2 outline-none transition-all"
                  placeholder="Task title..."
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 ml-1">
                  <AlignLeft size={14} className="text-gray-400 dark:text-gray-500" />
                  <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</label>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full text-sm text-gray-600 dark:text-gray-300 bg-gray-50/60 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] resize-none leading-relaxed transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Add a description for this task..."
                />
              </div>

              {/* Detail Tabs */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                <div className="flex items-center gap-1 mb-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === tab.id
                          ? "bg-[#34247A]/5 dark:bg-[#7C5DFA]/10 text-[#34247A] dark:text-[#7C5DFA] border border-[#34247A]/10 dark:border-[#7C5DFA]/20"
                          : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-[#34247A] dark:bg-[#7C5DFA] text-white" : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Comments Tab */}
                {activeTab === "comments" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-[10px] font-bold text-[#34247A] dark:text-[#7C5DFA] flex-shrink-0 mt-0.5">A</div>
                      <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-1">
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void handleAddComment(); }}
                          placeholder="Write a comment..."
                          className="flex-1 bg-transparent text-sm px-2 py-1.5 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <button onClick={() => void handleAddComment()} disabled={isSendingComment || !commentText.trim()} className="p-1.5 bg-[#34247A] text-white rounded-lg hover:bg-[#2A1D63] transition-colors disabled:opacity-40">
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                      {comments.length === 0 && <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">No comments yet. Start the conversation!</div>}
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2 group p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          {comment.user_avatar ? (
                            <img src={comment.user_avatar} alt={comment.user_name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">{comment.user_name.charAt(0)}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{comment.user_name}</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(comment.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">{comment.content}</p>
                          </div>
                          <button onClick={() => void handleDeleteComment(comment.id)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtasks Tab */}
                {activeTab === "subtasks" && (
                  <div className="flex flex-col gap-3">
                    {subtasks.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#34247A] to-[#7C5DFA] rounded-full transition-all duration-300" style={{ width: `${subtaskProgress}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{doneCount}/{subtasks.length}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-1">
                      <Plus size={14} className="text-gray-400 dark:text-gray-500 ml-2" />
                      <input value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleAddSubtask(); }} placeholder="Add a checklist item..." className="flex-1 bg-transparent text-sm px-1 py-1.5 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                      <button onClick={() => void handleAddSubtask()} disabled={!subtaskText.trim()} className="px-3 py-1.5 bg-[#34247A] text-white text-[10px] font-bold rounded-lg hover:bg-[#2A1D63] transition-colors disabled:opacity-40">Add</button>
                    </div>
                    <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                      {subtasks.length === 0 && <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">No checklist items yet.</div>}
                      {subtasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-2 group p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <button onClick={() => void handleToggleSubtask(st.id)} className="flex-shrink-0">
                            {st.is_done === 1 ? <CheckSquare size={18} className="text-[#34247A] dark:text-[#7C5DFA]" /> : <Square size={18} className="text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-400" />}
                          </button>
                          <span className={`flex-1 text-sm ${st.is_done === 1 ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>{st.title}</span>
                          <button onClick={() => void handleDeleteSubtask(st.id)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags Tab */}
                {activeTab === "tags" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-1">
                        <Tag size={14} className="text-gray-400 dark:text-gray-500 ml-2" />
                        <input value={tagText} onChange={(e) => setTagText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleAddTag(); }} placeholder="Tag name..." className="flex-1 bg-transparent text-sm px-1 py-1.5 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                        <button onClick={() => void handleAddTag()} disabled={!tagText.trim()} className="px-3 py-1.5 bg-[#34247A] text-white text-[10px] font-bold rounded-lg hover:bg-[#2A1D63] transition-colors disabled:opacity-40">Add</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Color</span>
                      {tagColors.map((c) => (
                        <button key={c} onClick={() => setTagColor(c)} className={`w-5 h-5 rounded-full transition-all ${tagColor === c ? "ring-2 ring-offset-1 dark:ring-offset-[#1A1530] ring-gray-400 dark:ring-gray-500 scale-110" : "hover:scale-110"}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.length === 0 && <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500 w-full">No tags yet. Add one above!</div>}
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold group" style={{ backgroundColor: tag.color }}>
                          {tag.label}
                          <button onClick={() => void handleDeleteTag(tag.id)} className="opacity-60 hover:opacity-100 transition-opacity"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right – Settings */}
            <div className="lg:col-span-5 flex flex-col gap-5 bg-gray-50/60 dark:bg-white/[0.03] rounded-[22px] border border-gray-100 dark:border-white/10 p-5 h-fit">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <BarChart2 size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Status</span>
                </div>
                <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 appearance-none cursor-pointer transition-colors">
                  {statusOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <BarChart2 size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Priority</span>
                </div>
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 appearance-none cursor-pointer transition-colors">
                  {priorityOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Due Date</span>
                </div>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 cursor-pointer transition-colors" />
              </div>

              {/* Assignee Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <UserCircle size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Assignee</span>
                </div>
                <div className="relative">
                  <div
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="w-full flex items-center gap-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 shadow-sm outline-none hover:border-gray-300 dark:hover:border-white/20 cursor-pointer transition-all"
                  >
                    {assignedMember ? (
                      <>
                        {assignedMember.user_avatar ? (
                          <img src={assignedMember.user_avatar} alt={assignedMember.user_name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-[10px] font-bold text-[#34247A] dark:text-[#7C5DFA] flex-shrink-0">
                            {assignedMember.user_name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex-1 text-left truncate">{assignedMember.user_name}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); setAssignedTo(null); setShowAssigneeDropdown(false); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setAssignedTo(null); setShowAssigneeDropdown(false); } }}
                          className="p-0.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer"
                        >
                          <X size={14} />
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                          <UserCircle size={14} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-400 dark:text-gray-500 flex-1 text-left">Unassigned</span>
                      </>
                    )}
                  </div>

                  {showAssigneeDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#1E1A2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-20 overflow-hidden">
                      <div className="max-h-[200px] overflow-y-auto py-1">
                        {members.length === 0 && (
                          <div className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">No members found</div>
                        )}
                        {members.map((member) => (
                          <div
                            key={member.user_id}
                            onClick={() => { setAssignedTo(member.user_id); setShowAssigneeDropdown(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${assignedTo === member.user_id ? "bg-purple-50 dark:bg-purple-500/10" : ""}`}
                          >
                            {member.user_avatar ? (
                              <img src={member.user_avatar} alt={member.user_name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-[10px] font-bold text-[#34247A] dark:text-[#7C5DFA] flex-shrink-0">
                                {member.user_name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{member.user_name}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{member.role}</p>
                            </div>
                            {assignedTo === member.user_id && (
                              <CheckCircle2 size={16} className="text-[#34247A] dark:text-[#7C5DFA] flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Checklist Progress</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#34247A] dark:bg-[#7C5DFA] rounded-full transition-all duration-300" style={{ width: `${subtaskProgress}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#34247A] dark:text-[#7C5DFA]">{subtaskProgress}%</span>
                  </div>
                </div>
              )}

              <div className="pt-3 mt-auto border-t border-gray-100 dark:border-white/10">
                <button onClick={handleDelete} disabled={isDeleting} className="flex items-center justify-center gap-2 w-full py-2.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-[11px] font-bold uppercase tracking-widest disabled:opacity-50">
                  <Trash2 size={14} />
                  {isDeleting ? "Deleting..." : "Delete Task"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-gray-50/40 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-xl">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-7 py-2.5 bg-[#34247A] hover:bg-[#2A1D63] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-900/15 transition-all active:scale-[0.97] disabled:opacity-60">
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
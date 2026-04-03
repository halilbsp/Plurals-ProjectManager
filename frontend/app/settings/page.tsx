"use client";
/* eslint-disable @next/next/no-img-element */

import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Save,
  User,
  Bell,
  Palette,
  Shield,
  Building2,
  Pencil,
  Trash2,
  Crown,
  Users,
  Check,
  Moon,
  Sun,
  Monitor,
  Camera,
  Loader2,
  X,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { uploadAvatar, updateUserProfile } from "@/api/user";
import { changePassword } from "@/api/auth";
import {
  getWorkspaceDetail,
  updateWorkspace,
  deleteWorkspace,
  getUserWorkspaces,
  type WorkspaceDetail,
} from "@/api/workspace";
import { useRouter } from "next/navigation";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
];

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || fallback;
  }

  return fallback;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, activeWorkspace, setActiveWorkspace, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  /* ── Avatar Upload State ── */
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Password Change State ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwChanging, setPwChanging] = useState(false);
  const [pwChanged, setPwChanged] = useState(false);
  const [pwError, setPwError] = useState("");

  /* ── Workspace State ── */
  const [wsDetail, setWsDetail] = useState<WorkspaceDetail | null>(null);
  const [wsName, setWsName] = useState("");
  const [wsEditing, setWsEditing] = useState(false);
  const [wsSaving, setWsSaving] = useState(false);
  const [wsDeleting, setWsDeleting] = useState(false);
  const [wsDeleteConfirm, setWsDeleteConfirm] = useState(false);
  const [wsSaved, setWsSaved] = useState(false);
  const [wsError, setWsError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  const loadWorkspaceDetail = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const detail = await getWorkspaceDetail(activeWorkspace.id);
      setWsDetail(detail);
      setWsName(detail.name);
    } catch {
      setWsDetail(null);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeTab === "workspace" && activeWorkspace) {
      void loadWorkspaceDetail();
    }
  }, [activeTab, activeWorkspace, loadWorkspaceDetail]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  /* ── Avatar Handlers ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Invalid file type. Please use JPG, PNG, SVG or WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 2MB.");
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleRemoveSelectedFile = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Profile Save ── */
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError("");
    try {
      let newAvatarUrl = user.avatar;
      if (avatarFile) {
        const result = await uploadAvatar(user.id, avatarFile);
        newAvatarUrl = result.avatar_url;
      }
      await updateUserProfile(user.id, {
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
      });
      updateUser({
        ...user,
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        avatar: newAvatarUrl,
      });
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save profile."));
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Password Change ── */
  const handleChangePassword = async () => {
    if (!user) return;
    setPwError("");

    if (!currentPassword.trim()) {
      setPwError("Please enter your current password.");
      return;
    }
    if (!newPassword.trim()) {
      setPwError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPwError("New password must be different from current password.");
      return;
    }

    setPwChanging(true);
    try {
      await changePassword(user.id, currentPassword, newPassword);
      setPwChanged(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwChanged(false), 3000);
    } catch (err: unknown) {
      setPwError(getErrorMessage(err, "Failed to change password."));
    } finally {
      setPwChanging(false);
    }
  };

  /* ── Workspace Handlers ── */
  const handleWsRename = async () => {
    if (!activeWorkspace || !user || !wsName.trim()) return;
    setWsSaving(true);
    setWsError("");
    try {
      const updated = await updateWorkspace(activeWorkspace.id, user.id, wsName.trim());
      setActiveWorkspace({ id: updated.id, name: updated.name, owner_id: updated.owner_id });
      setWsEditing(false);
      setWsSaved(true);
      setTimeout(() => setWsSaved(false), 2500);
      await loadWorkspaceDetail();
    } catch (err: unknown) {
      setWsError(getErrorMessage(err, "Failed to rename workspace."));
    } finally {
      setWsSaving(false);
    }
  };

  const handleWsDelete = async () => {
    if (!activeWorkspace || !user) return;
    setWsDeleting(true);
    setWsError("");
    try {
      const result = await deleteWorkspace(activeWorkspace.id, user.id);
      if (result.active_workspace_id) {
        const allWs = await getUserWorkspaces(user.id);
        const newWs = allWs.find((w) => w.id === result.active_workspace_id);
        if (newWs) {
          setActiveWorkspace({ id: newWs.id, name: newWs.name, owner_id: newWs.owner_id });
        }
      }
      setWsDeleteConfirm(false);
      router.push("/");
    } catch (err: unknown) {
      setWsError(getErrorMessage(err, "Failed to delete workspace."));
    } finally {
      setWsDeleting(false);
    }
  };

  const isOwner = activeWorkspace && user && activeWorkspace.owner_id === user.id;

  const themeOptions = [
    { id: "light" as const, label: "Light", icon: Sun, preview: "bg-white border border-gray-200" },
    { id: "dark" as const, label: "Dark", icon: Moon, preview: "bg-[#0F0A21]" },
  ];

  const displayAvatar = avatarPreview || user?.avatar || "https://i.pravatar.cc/150?u=arshakir";

  /* ── Password strength indicator ── */
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { level: 2, label: "Fair", color: "bg-orange-500" };
    if (score <= 3) return { level: 3, label: "Good", color: "bg-yellow-500" };
    if (score <= 4) return { level: 4, label: "Strong", color: "bg-green-500" };
    return { level: 5, label: "Very Strong", color: "bg-emerald-500" };
  };

  const pwStrength = getPasswordStrength(newPassword);

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your account preferences and workspace settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#1A1530] rounded-[24px] shadow-sm border border-gray-100 dark:border-white/10 p-3 transition-colors">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#34247A]/5 dark:bg-[#7C5DFA]/10 text-[#34247A] dark:text-[#7C5DFA] border border-[#34247A]/10 dark:border-[#7C5DFA]/20"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <div className="bg-white dark:bg-[#1A1530] rounded-[24px] shadow-sm border border-gray-100 dark:border-white/10 p-8 transition-colors">
            {/* ─── Profile ─── */}
            {activeTab === "profile" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Profile Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal information and profile photo.</p>
                </div>

                {error && (
                  <div className="flex items-center justify-between bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
                    <span>{error}</span>
                    <button onClick={() => setError("")} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-5">
                  <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-900/30 overflow-hidden shadow-sm">
                      <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera size={22} className="text-white drop-shadow-md" />
                    </div>
                    {avatarFile && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-[#1A1530] flex items-center justify-center">
                        <Check size={8} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">
                        {avatarFile ? "Change File" : "Change Photo"}
                      </button>
                      {avatarFile && (
                        <button type="button" onClick={handleRemoveSelectedFile} className="px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                      {avatarFile ? (
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          {avatarFile.name} <span className="text-gray-400 dark:text-gray-500 font-normal">({(avatarFile.size / 1024).toFixed(0)}KB)</span>
                        </span>
                      ) : (
                        "JPG, PNG or SVG. Max 2MB."
                      )}
                    </p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp" onChange={handleFileSelect} className="hidden" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</label>
                    <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timezone</label>
                    <select className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 appearance-none cursor-pointer transition-colors">
                      <option>UTC+03:00 Istanbul</option>
                      <option>UTC+00:00 London</option>
                      <option>UTC-05:00 New York</option>
                      <option>UTC-08:00 Los Angeles</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => void handleSave()} disabled={isSaving} className={`flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] ${saved ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20" : "bg-[#34247A] hover:bg-[#2A1D63] text-white shadow-lg shadow-purple-900/15 disabled:opacity-50"}`}>
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saved ? "Saved!" : isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ─── Workspace ─── */}
            {activeTab === "workspace" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Workspace Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your workspace name, members and preferences.</p>
                </div>

                {wsError && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium px-4 py-3 rounded-xl">{wsError}</div>
                )}

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3CE0D0] to-[#7C5CFC] flex items-center justify-center text-lg font-bold text-white">
                        {wsDetail?.name?.charAt(0)?.toUpperCase() || "W"}
                      </div>
                      <div>
                        {wsEditing ? (
                          <div className="flex items-center gap-2">
                            <input value={wsName} onChange={(e) => setWsName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleWsRename()} className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 w-56 transition-colors" autoFocus />
                            <button onClick={handleWsRename} disabled={wsSaving || !wsName.trim()} className="px-4 py-2 bg-[#34247A] text-white text-xs font-bold rounded-xl hover:bg-[#2A1D63] disabled:opacity-40 transition-colors">{wsSaving ? "Saving..." : "Save"}</button>
                            <button onClick={() => { setWsEditing(false); setWsName(wsDetail?.name || ""); }} className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{wsDetail?.name || activeWorkspace?.name || "Workspace"}</h3>
                            {wsSaved && <span className="text-xs font-bold text-green-500">Updated!</span>}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {wsDetail?.member_count || 0} member{(wsDetail?.member_count || 0) !== 1 ? "s" : ""}
                          {isOwner && <span className="ml-2 text-[#34247A] dark:text-[#7C5DFA] font-semibold">· Owner</span>}
                        </p>
                      </div>
                    </div>
                    {isOwner && !wsEditing && (
                      <button onClick={() => setWsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                        <Pencil size={14} />
                        Rename
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-gray-400 dark:text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Members</h3>
                  </div>
                  <div className="space-y-2">
                    {wsDetail?.members?.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-3">
                          <img src={member.user_avatar || "https://i.pravatar.cc/150"} alt={member.user_name} className="w-9 h-9 rounded-xl object-cover" />
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{member.user_name}</h4>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">{member.role}</p>
                          </div>
                        </div>
                        {member.role === "owner" && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <Crown size={14} />
                            <span className="text-[11px] font-bold uppercase">Owner</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isOwner && (
                  <div className="border border-red-100 dark:border-red-500/20 rounded-2xl p-6 bg-red-50/30 dark:bg-red-500/5">
                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Permanently delete this workspace and all of its data. This action cannot be undone.</p>
                    {wsDeleteConfirm ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">Are you sure?</span>
                        <button onClick={handleWsDelete} disabled={wsDeleting} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
                          <Trash2 size={14} />
                          {wsDeleting ? "Deleting..." : "Yes, Delete"}
                        </button>
                        <button onClick={() => setWsDeleteConfirm(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setWsDeleteConfirm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                        Delete Workspace
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── Notifications ─── */}
            {activeTab === "notifications" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Notification Preferences</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose how and when you receive notifications.</p>
                </div>
                {[
                  { label: "Task assignments", desc: "When a task is assigned to you", default: true },
                  { label: "Task completions", desc: "When a team member completes a task", default: true },
                  { label: "Broadcasts", desc: "New broadcast messages from team", default: true },
                  { label: "Sprint reminders", desc: "Upcoming sprint review alerts", default: false },
                  { label: "Weekly digest", desc: "Weekly summary email every Monday", default: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-white/5 last:border-b-0">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 dark:bg-white/10 peer-focus:ring-2 peer-focus:ring-purple-100 dark:peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#34247A]" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Appearance ─── */}
            {activeTab === "appearance" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Appearance</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customize how Plurals looks for you.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`relative border-2 rounded-2xl p-5 cursor-pointer transition-all text-left ${
                        theme === opt.id
                          ? "border-[#34247A] dark:border-[#7C5DFA] bg-purple-50/30 dark:bg-purple-500/5"
                          : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                      }`}
                    >
                      {theme === opt.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#34247A] dark:bg-[#7C5DFA] flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className={`h-20 rounded-xl mb-3 ${opt.preview}`} />
                      <div className="flex items-center gap-2">
                        <opt.icon size={16} className={theme === opt.id ? "text-[#34247A] dark:text-[#7C5DFA]" : "text-gray-400 dark:text-gray-500"} />
                        <span className={`text-sm font-bold ${theme === opt.id ? "text-[#34247A] dark:text-[#7C5DFA]" : "text-gray-500 dark:text-gray-400"}`}>
                          {opt.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <Monitor size={18} className="text-gray-400 dark:text-gray-500" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">System Preference</h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Automatically match your operating system theme. Coming soon.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Security ─── */}
            {activeTab === "security" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Security</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your password and account security.</p>
                </div>

                {/* Success Message */}
                {pwChanged && (
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold px-4 py-3 rounded-xl">
                    <Check size={16} />
                    Password updated successfully!
                  </div>
                )}

                {/* Error Message */}
                {pwError && (
                  <div className="flex items-center justify-between bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
                    <span>{pwError}</span>
                    <button onClick={() => setPwError("")} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#34247A]/10 dark:bg-[#7C5DFA]/10 rounded-xl">
                      <Lock size={18} className="text-[#34247A] dark:text-[#7C5DFA]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Change Password</h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Use a strong password with at least 6 characters.</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-md">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => { setCurrentPassword(e.target.value); setPwError(""); }}
                          placeholder="Enter current password"
                          className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-4 py-3 pr-11 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setPwError(""); }}
                          placeholder="Enter new password"
                          className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-4 py-3 pr-11 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 focus:border-[#34247A] dark:focus:border-[#7C5DFA] transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  i <= pwStrength.level ? pwStrength.color : "bg-gray-200 dark:bg-white/10"
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`text-[10px] font-semibold ${
                            pwStrength.level <= 1 ? "text-red-500" :
                            pwStrength.level <= 2 ? "text-orange-500" :
                            pwStrength.level <= 3 ? "text-yellow-500" :
                            "text-green-500"
                          }`}>
                            {pwStrength.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setPwError(""); }}
                          placeholder="Confirm new password"
                          className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-white/5 ${
                            confirmPassword && confirmPassword !== newPassword
                              ? "border-red-300 dark:border-red-500/30 focus:border-red-400"
                              : confirmPassword && confirmPassword === newPassword
                              ? "border-green-300 dark:border-green-500/30 focus:border-green-400"
                              : "border-gray-200 dark:border-white/10 focus:border-[#34247A] dark:focus:border-[#7C5DFA]"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-[11px] text-red-500 font-medium mt-1">Passwords do not match.</p>
                      )}
                      {confirmPassword && confirmPassword === newPassword && newPassword.length > 0 && (
                        <p className="text-[11px] text-green-500 font-medium mt-1 flex items-center gap-1">
                          <Check size={10} /> Passwords match!
                        </p>
                      )}
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                      <button
                        onClick={() => void handleChangePassword()}
                        disabled={pwChanging || !currentPassword || !newPassword || !confirmPassword}
                        className={`flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] ${
                          pwChanged
                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20"
                            : "bg-[#34247A] hover:bg-[#2A1D63] text-white shadow-lg shadow-purple-900/15 disabled:opacity-50"
                        }`}
                      >
                        {pwChanging ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Shield size={16} />
                        )}
                        {pwChanged ? "Password Updated!" : pwChanging ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Account Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Email</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.email || ""}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Account ID</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">#{user?.id || ""}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Role</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.role || "Member"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

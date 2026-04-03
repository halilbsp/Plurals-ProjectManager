import { api } from "./api";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  active_workspace_id?: number | null;
}

export interface WorkspaceInfo {
  id: number;
  name: string;
  owner_id: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  workspace?: WorkspaceInfo | null;
}

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return res.data;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
  });
  return res.data;
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ detail: string }> => {
  const res = await api.post<{ detail: string }>("/auth/change-password", {
    user_id: userId,
    current_password: currentPassword,
    new_password: newPassword,
  });
  return res.data;
};

export const getMe = async (
  userId: number
): Promise<AuthUser & { workspace?: WorkspaceInfo | null }> => {
  const res = await api.get("/auth/me", {
    params: { user_id: userId },
  });
  return res.data;
};
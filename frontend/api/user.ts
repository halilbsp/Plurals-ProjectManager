import { api } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface ProjectMember {
  id: number;
  user_id: number;
  project_id: number;
  role: string;
  user: User;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

export const getUsers = async (): Promise<User[]> => {
  const res = await api.get<User[]>("/user");
  return res.data;
};

export const updateUserProfile = async (
  userId: number,
  data: UpdateUserPayload
): Promise<User> => {
  const res = await api.put<User>(`/user/${userId}`, data);
  return res.data;
};

export const uploadAvatar = async (
  userId: number,
  file: File
): Promise<{ avatar_url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<{ avatar_url: string }>(
    `/user/${userId}/avatar`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};

export const getProjectMembers = async (
  projectId: number
): Promise<ProjectMember[]> => {
  const res = await api.get<ProjectMember[]>(`/user/project/${projectId}`);
  return res.data;
};

export const addMemberToProject = async (
  projectId: number,
  userId: number
): Promise<ProjectMember> => {
  const res = await api.post<ProjectMember>(
    `/user/project/${projectId}/add/${userId}`
  );
  return res.data;
};

export const removeMemberFromProject = async (
  projectId: number,
  userId: number
): Promise<void> => {
  await api.delete(`/user/project/${projectId}/remove/${userId}`);
};
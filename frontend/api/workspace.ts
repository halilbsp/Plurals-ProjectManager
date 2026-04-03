import { api } from "./api";

export interface WorkspaceItem {
  id: number;
  name: string;
  owner_id: number;
  created_at?: string;
  member_count: number;
  role: string;
}

export interface WorkspaceMember {
  id: number;
  workspace_id: number;
  user_id: number;
  role: string;
  user_name: string;
  user_avatar: string;
}

export interface WorkspaceDetail {
  id: number;
  name: string;
  owner_id: number;
  created_at?: string;
  members: WorkspaceMember[];
  member_count: number;
}

export const getUserWorkspaces = async (
  userId: number
): Promise<WorkspaceItem[]> => {
  const res = await api.get("/workspace", {
    params: { user_id: userId },
  });
  return res.data;
};

export const getWorkspaceDetail = async (
  workspaceId: number
): Promise<WorkspaceDetail> => {
  const res = await api.get(`/workspace/${workspaceId}`);
  return res.data;
};

export const createWorkspace = async (
  userId: number,
  name: string
): Promise<WorkspaceItem> => {
  const res = await api.post(
    "/workspace",
    { name },
    { params: { user_id: userId } }
  );
  return res.data;
};

export const updateWorkspace = async (
  workspaceId: number,
  userId: number,
  name: string
): Promise<{ id: number; name: string; owner_id: number }> => {
  const res = await api.put(
    `/workspace/${workspaceId}`,
    { name },
    { params: { user_id: userId } }
  );
  return res.data;
};

export const deleteWorkspace = async (
  workspaceId: number,
  userId: number
): Promise<{ message: string; active_workspace_id: number | null }> => {
  const res = await api.delete(`/workspace/${workspaceId}`, {
    params: { user_id: userId },
  });
  return res.data;
};

export const switchWorkspace = async (
  userId: number,
  workspaceId: number
): Promise<{
  message: string;
  workspace: { id: number; name: string; owner_id: number };
}> => {
  const res = await api.post(
    "/workspace/switch",
    { workspace_id: workspaceId },
    { params: { user_id: userId } }
  );
  return res.data;
};
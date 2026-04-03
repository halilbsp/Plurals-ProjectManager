import { api } from "./api";

export interface Project {
  id: number;
  name: string;
  workspace_id: number | null;
}

export interface ProjectMember {
  id: number;
  user_id: number;
  role: string;
  user_name: string;
  user_email: string;
  user_avatar: string;
}

export interface CreateProjectPayload {
  name: string;
  workspace_id?: number | null;
}

export interface UpdateProjectPayload {
  name?: string;
}

export const getProjects = async (
  workspaceId?: number
): Promise<Project[]> => {
  const response = await api.get<Project[]>("/project", {
    params:
      workspaceId === undefined
        ? undefined
        : { workspace_id: workspaceId },
  });
  return response.data;
};

export const getProjectMembers = async (
  projectId: number
): Promise<ProjectMember[]> => {
  const response = await api.get<ProjectMember[]>(
    `/project/${projectId}/members`
  );
  return response.data;
};

export const createProject = async (
  data: CreateProjectPayload
): Promise<Project> => {
  const response = await api.post<Project>("/project", data);
  return response.data;
};

export const updateProject = async (
  id: number,
  data: UpdateProjectPayload
): Promise<Project> => {
  const response = await api.put<Project>(`/project/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/project/${id}`);
};
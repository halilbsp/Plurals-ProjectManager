import { api } from "./api";

export interface Launch {
  id: number;
  title: string;
  description: string;
  launch_date: string;
  project_id: number | null;
}

export interface CreateLaunchPayload {
  title: string;
  description?: string;
  launch_date: string;
  project_id?: number | null;
}

export const getLaunches = async (
  projectId?: number
): Promise<Launch[]> => {
  const res = await api.get<Launch[]>("/launch", {
    params: projectId ? { project_id: projectId } : undefined,
  });
  return res.data;
};

export const createLaunch = async (
  data: CreateLaunchPayload
): Promise<Launch> => {
  const res = await api.post<Launch>("/launch", data);
  return res.data;
};

export const deleteLaunch = async (id: number): Promise<void> => {
  await api.delete(`/launch/${id}`);
};
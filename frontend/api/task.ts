import { api } from "./api";

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: number;
  assigned_to: number | null;
}

export interface CreateTaskPayload {
  title: string;
  project_id: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  description?: string | null;
  due_date?: string | null;
  assigned_to?: number | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assigned_to?: number | null;
}

export const getTasks = async (projectId: number): Promise<Task[]> => {
  const res = await api.get<Task[]>("/task", {
    params: { project_id: projectId },
  });
  return res.data;
};

export const createTask = async (data: CreateTaskPayload): Promise<Task> => {
  const res = await api.post<Task>("/task", data);
  return res.data;
};

export const updateTask = async (
  id: number,
  data: UpdateTaskPayload
): Promise<Task> => {
  const res = await api.put<Task>(`/task/${id}`, data);
  return res.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/task/${id}`);
};

// ── Export Functions ──

export const exportTasksCSV = (projectId: number): void => {
  const url = `${api.defaults.baseURL}/export/tasks/csv?project_id=${projectId}`;
  window.open(url, "_blank");
};

export const exportTasksPDF = (projectId: number): void => {
  const url = `${api.defaults.baseURL}/export/tasks/pdf?project_id=${projectId}`;
  window.open(url, "_blank");
};

export const exportAnalyticsCSV = (projectId: number): void => {
  const url = `${api.defaults.baseURL}/export/analytics/csv?project_id=${projectId}`;
  window.open(url, "_blank");
};
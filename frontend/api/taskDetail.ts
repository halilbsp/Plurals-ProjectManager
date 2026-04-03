import { api } from "./api";

// ───── Comments ─────

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number | null;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar: string;
}

export const getComments = async (taskId: number): Promise<TaskComment[]> => {
  const res = await api.get<TaskComment[]>(`/task/${taskId}/comments`);
  return res.data;
};

export const addComment = async (
  taskId: number,
  content: string,
  userId?: number
): Promise<TaskComment> => {
  const res = await api.post<TaskComment>(`/task/${taskId}/comments`, {
    content,
    user_id: userId ?? 1,
  });
  return res.data;
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/task/comments/${commentId}`);
};

// ───── Subtasks ─────

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_done: number;
}

export const getSubtasks = async (taskId: number): Promise<Subtask[]> => {
  const res = await api.get<Subtask[]>(`/task/${taskId}/subtasks`);
  return res.data;
};

export const addSubtask = async (
  taskId: number,
  title: string
): Promise<Subtask> => {
  const res = await api.post<Subtask>(`/task/${taskId}/subtasks`, { title });
  return res.data;
};

export const toggleSubtask = async (subtaskId: number): Promise<Subtask> => {
  const res = await api.put<Subtask>(`/task/subtasks/${subtaskId}/toggle`);
  return res.data;
};

export const deleteSubtask = async (subtaskId: number): Promise<void> => {
  await api.delete(`/task/subtasks/${subtaskId}`);
};

// ───── Tags ─────

export interface TaskTag {
  id: number;
  task_id: number;
  label: string;
  color: string;
}

export const getTags = async (taskId: number): Promise<TaskTag[]> => {
  const res = await api.get<TaskTag[]>(`/task/${taskId}/tags`);
  return res.data;
};

export const addTag = async (
  taskId: number,
  label: string,
  color: string = "#34247A"
): Promise<TaskTag> => {
  const res = await api.post<TaskTag>(`/task/${taskId}/tags`, { label, color });
  return res.data;
};

export const deleteTag = async (tagId: number): Promise<void> => {
  await api.delete(`/task/tags/${tagId}`);
};
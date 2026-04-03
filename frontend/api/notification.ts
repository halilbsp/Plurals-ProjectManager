import { api } from "./api";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  project_id: number | null;
  target_user_id: number | null;
  sender_id: number | null;
  sender_name: string;
  sender_avatar: string;
  created_at: string;
}

export interface UnreadCount {
  count: number;
}

export interface CreateNotificationPayload {
  title: string;
  message?: string;
  type?: string;
  project_id?: number | null;
  target_user_id?: number | null;
  sender_id?: number | null;
  sender_name?: string;
  sender_avatar?: string;
}

export const getNotifications = async (
  limit: number = 20,
  userId?: number
): Promise<Notification[]> => {
  const params: Record<string, unknown> = { limit };
  if (userId) params.user_id = userId;
  const res = await api.get<Notification[]>("/notification", { params });
  return res.data;
};

export const getUnreadCount = async (
  userId?: number
): Promise<UnreadCount> => {
  const params: Record<string, unknown> = {};
  if (userId) params.user_id = userId;
  const res = await api.get<UnreadCount>("/notification/unread-count", { params });
  return res.data;
};

export const createNotification = async (
  data: CreateNotificationPayload
): Promise<Notification> => {
  const res = await api.post<Notification>("/notification", data);
  return res.data;
};

export const createBulkNotifications = async (
  data: CreateNotificationPayload[]
): Promise<Notification[]> => {
  const res = await api.post<Notification[]>("/notification/bulk", data);
  return res.data;
};

export const markAsRead = async (id: number): Promise<Notification> => {
  const res = await api.put<Notification>(`/notification/${id}/read`);
  return res.data;
};

export const markAllAsRead = async (userId?: number): Promise<void> => {
  const params: Record<string, unknown> = {};
  if (userId) params.user_id = userId;
  await api.put("/notification/read-all", undefined, { params });
};
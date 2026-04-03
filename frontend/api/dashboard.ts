import { api } from "./api";

export interface DashboardSummary {
  project_id: number;
  project_name: string;
  project_description: string;
  main_task_title: string;
  main_task_status: string;
  tasks_count: number;
  logged_hours: number;
}

export interface WeeklyActivityPoint {
  day: string;
  completion_rate: number;
  completed_tasks: number;
  creation_rate: number;
  created_tasks: number;
}

export interface ProjectHoursPoint {
  project_id: number;
  name: string;
  hours: number;
}

export interface DashboardAnalytics {
  selected_project_id: number;
  selected_project_name: string;
  weekly_activity: WeeklyActivityPoint[];
  project_hours: ProjectHoursPoint[];
}

export const getDashboardSummary = async (
  projectId: number
): Promise<DashboardSummary> => {
  const response = await api.get<DashboardSummary>("/dashboard/summary", {
    params: {
      project_id: projectId,
    },
  });

  return response.data;
};

export const getDashboardAnalytics = async (
  projectId: number
): Promise<DashboardAnalytics> => {
  const response = await api.get<DashboardAnalytics>("/dashboard/analytics", {
    params: {
      project_id: projectId,
    },
  });

  return response.data;
};
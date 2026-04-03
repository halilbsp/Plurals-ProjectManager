"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { getProjects, type Project } from "@/api/project";
import { useAuth } from "@/context/AuthContext";

interface ProjectContextValue {
  selectedProjectId: number;
  setSelectedProjectId: Dispatch<SetStateAction<number>>;
  projects: Project[];
  isLoadingProjects: boolean;
  reloadProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { activeWorkspace } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const reloadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const data = await getProjects();
      setProjects(data);

      if (data.length > 0) {
        setSelectedProjectId((current) =>
          data.some((p) => p.id === current) ? current : data[0].id
        );
      }
    } catch (error) {
      console.error("Projects could not be loaded:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // Reload projects when workspace changes
  useEffect(() => {
    void reloadProjects();
  }, [reloadProjects, activeWorkspace?.id]);

  const value = useMemo(
    () => ({
      selectedProjectId,
      setSelectedProjectId,
      projects,
      isLoadingProjects,
      reloadProjects,
    }),
    [selectedProjectId, projects, isLoadingProjects, reloadProjects]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider.");
  }
  return context;
}
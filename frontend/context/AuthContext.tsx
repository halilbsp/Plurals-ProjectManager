"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { type AuthUser } from "@/api/auth";

export interface WorkspaceInfo {
  id: number;
  name: string;
  owner_id: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  activeWorkspace: WorkspaceInfo | null;
  login: (token: string, user: AuthUser, workspace?: WorkspaceInfo | null) => void;
  logout: () => void;
  setActiveWorkspace: (ws: WorkspaceInfo) => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("plurals_token");
      const savedUser = localStorage.getItem("plurals_user");
      const savedWorkspace = localStorage.getItem("plurals_workspace");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (savedWorkspace) {
          setActiveWorkspaceState(JSON.parse(savedWorkspace));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (newToken: string, newUser: AuthUser, workspace?: WorkspaceInfo | null) => {
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("plurals_token", newToken);
      localStorage.setItem("plurals_user", JSON.stringify(newUser));
      if (workspace) {
        setActiveWorkspaceState(workspace);
        localStorage.setItem("plurals_workspace", JSON.stringify(workspace));
      }
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setActiveWorkspaceState(null);
    localStorage.removeItem("plurals_token");
    localStorage.removeItem("plurals_user");
    localStorage.removeItem("plurals_workspace");
  }, []);

  const setActiveWorkspace = useCallback((ws: WorkspaceInfo) => {
    setActiveWorkspaceState(ws);
    localStorage.setItem("plurals_workspace", JSON.stringify(ws));
  }, []);

  const updateUser = useCallback((newUser: AuthUser) => {
    setUser(newUser);
    localStorage.setItem("plurals_user", JSON.stringify(newUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      activeWorkspace,
      login,
      logout,
      setActiveWorkspace,
      updateUser,
    }),
    [user, token, isLoading, activeWorkspace, login, logout, setActiveWorkspace, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
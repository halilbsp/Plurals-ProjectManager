"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const publicRoutes = ["/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) {
      router.push("/login");
    }
  }, [isLoading, user, isPublicRoute, router]);

  useEffect(() => {
    if (!isLoading && user && isPublicRoute) {
      router.push("/");
    }
  }, [isLoading, user, isPublicRoute, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0A21] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-white/60 text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // Public route (login page)
  if (isPublicRoute) {
    if (user) {
      return (
        <div className="min-h-screen bg-[#0F0A21] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-white/60 text-sm font-medium">Redirecting...</span>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  // Authenticated layout
  return (
    <div className="min-h-screen relative bg-[#F8F9FB] dark:bg-[#0F0A21] transition-colors duration-300">
      <div className="w-64 fixed left-0 top-0 h-screen z-50">
        <Sidebar />
      </div>
      <div className="flex flex-col ml-64 min-w-0 min-h-screen">
        <Topbar />
        <main className="p-8 w-full flex-1">{children}</main>
      </div>
    </div>
  );
}
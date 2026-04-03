"use client";

import Sidebar from "../sidebar/Sidebar";
import Topbar from "../topbar/Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1 p-6 space-y-4">

        <Topbar />

        {children}

      </div>

    </div>
  );
}
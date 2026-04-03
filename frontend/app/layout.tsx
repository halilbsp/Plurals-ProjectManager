import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProjectProvider } from "@/context/ProjectContext";
import AuthGuard from "@/components/layout/AuthGuard";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plurals - Project Manager",
  description: "Modern SaaS Project Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-[#F8F9FB] dark:bg-[#0F0A21] text-black dark:text-white transition-colors duration-300`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ProjectProvider>
              <AuthGuard>{children}</AuthGuard>
            </ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
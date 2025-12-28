"use client";

import { useState } from "react";
import { Sidebar, SidebarContent } from "./Sidebar";
import { Header } from "./Header";
import { MobileDrawer } from "./MobileDrawer";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Mobile drawer */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={closeDrawer}>
        <div className="flex flex-col h-full">
          <SidebarContent onNavigate={closeDrawer} />
        </div>
      </MobileDrawer>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={openDrawer} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

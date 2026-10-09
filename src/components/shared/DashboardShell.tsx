"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Sidebar className="hidden md:flex" />
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-50">
            <Sidebar className="flex shadow-xl" onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main data-testid="main-content" className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
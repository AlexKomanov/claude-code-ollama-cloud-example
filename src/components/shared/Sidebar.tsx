"use client";

import React from "react";
import Link from "next/link";
import { useBoardStore } from "@/lib/stores/useBoardStore";
import { LayoutDashboard, Settings, FolderKanban, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { boards, currentBoardId, setCurrentBoard } = useBoardStore();

  return (
    <aside className={cn("flex flex-col w-64 h-screen bg-zinc-900 text-zinc-400 border-r border-zinc-800", className)}>
      <div className="p-6 flex items-center gap-3 text-white font-bold text-xl">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <FolderKanban className="w-6 h-6" />
        </div>
        <span>Ticketing</span>
      </div>

      <nav className="flex-1 px-4 space-y-8 mt-4">
        <div>
          <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Main Menu
          </p>
          <div className="space-y-1">
            <Link
              href="/boards"
              onClick={onNavigate}
              data-testid="nav-boards"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>All Boards</span>
            </Link>
            <Link
              href="/settings"
              onClick={onNavigate}
              data-testid="nav-settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        <div>
          <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            My Boards
          </p>
          <div className="space-y-1">
            {boards.map((board) => (
              <button
                key={board.id}
                data-testid={`sidebar-board-${board.id}`}
                onClick={() => { setCurrentBoard(board.id); onNavigate?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left",
                  currentBoardId === board.id 
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-zinc-800 hover:text-white"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: board.color }}
                />
                <span className="truncate">{board.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button data-testid="logout-button" className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-red-900/20 hover:text-red-400 transition-colors text-left">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

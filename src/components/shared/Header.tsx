"use client";

import React from "react";
import { useBoardStore } from "@/lib/stores/useBoardStore";
import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentBoardId, boards, filters, updateFilter } = useBoardStore();
  const currentBoard = boards.find(b => b.id === currentBoardId);

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open menu" data-testid="menu-toggle">
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {currentBoard ? currentBoard.name : "Select a Board"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            value={filters.searchQuery}
            onChange={(e) => updateFilter({ searchQuery: e.target.value })}
            data-testid="header-search"
          />
        </div>
        
        <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 relative" data-testid="notifications-button">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
            AD
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Alex Admin</span>
        </div>
      </div>
    </header>
  );
}

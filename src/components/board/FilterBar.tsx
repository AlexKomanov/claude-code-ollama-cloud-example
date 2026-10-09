"use client";

import React from "react";
import { useBoardStore } from "@/lib/stores/useBoardStore";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FilterBar() {
  const { filters, updateFilter } = useBoardStore();
  const { users } = useUserStore();

  const clearFilters = () => {
    updateFilter({
      searchQuery: "",
      assigneeId: "all",
      priority: "all",
      labelIds: [],
    });
  };

  const hasActiveFilters = 
    filters.searchQuery !== "" || 
    filters.assigneeId !== "all" || 
    filters.priority !== "all" || 
    filters.labelIds.length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search tasks..."
          className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          value={filters.searchQuery}
          onChange={(e) => updateFilter({ searchQuery: e.target.value })}
          data-testid="filter-search"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <Select 
            value={filters.priority} 
            onValueChange={(val) => updateFilter({ priority: val ?? "all" })}
          >
            <SelectTrigger data-testid="filter-priority" className="w-[130px] bg-zinc-50 dark:bg-zinc-900 h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem data-testid="filter-priority-all" value="all">All Priorities</SelectItem>
              <SelectItem data-testid="filter-priority-low" value="low">Low</SelectItem>
              <SelectItem data-testid="filter-priority-medium" value="medium">Medium</SelectItem>
              <SelectItem data-testid="filter-priority-high" value="high">High</SelectItem>
              <SelectItem data-testid="filter-priority-critical" value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select 
            value={filters.assigneeId} 
            onValueChange={(val) => updateFilter({ assigneeId: val ?? "all" })}
          >
            <SelectTrigger data-testid="filter-assignee" className="w-[150px] bg-zinc-50 dark:bg-zinc-900 h-9">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem data-testid="filter-assignee-all" value="all">All Assignees</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id} data-testid={`filter-assignee-${user.id}`}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            data-testid="filter-clear"
            onClick={clearFilters}
            className="h-9 gap-2 text-zinc-500 hover:text-red-500"
          >
            <X className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

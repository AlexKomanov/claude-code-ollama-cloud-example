"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types";
import { useUserStore } from "@/lib/stores/useUserStore";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTaskProps {
  task: Task;
}

export function SortableTask({ task }: SortableTaskProps) {
  const users = useUserStore((s) => s.users);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const initials = assignee
    ? assignee.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`task-card-${task.id}`}
      className={cn(
        "bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-blue-400 transition-colors cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 border-blue-500 ring-2 ring-blue-500/20 scale-105 z-50 shadow-xl"
      )}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="cursor-grab" data-testid={`task-grip-${task.id}`}>
          <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {task.title}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          <span data-testid={`task-priority-${task.id}`} className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
            task.priority === 'critical' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            task.priority === 'high' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            task.priority === 'medium' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            task.priority === 'low' && "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
          )}>
            {task.priority}
          </span>
        </div>
        <div data-testid={`task-avatar-${task.id}`} className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-medium" title={assignee?.name}>
          {initials}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useBoardStore } from "@/lib/stores/useBoardStore";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Board, Column, Task } from "@/types";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTask } from "@/components/board/SortableTask";
import { TaskModal } from "@/components/task/TaskModal";
import { FilterBar } from "@/components/board/FilterBar";
import { socket } from "@/lib/socket/socket";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const { boards, columns, tasks, filters, setBoards, setColumns, setTasks, setCurrentBoard } = useBoardStore();
  const { users, setUsers } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);
  // Derived from the store so edits to the task show up in the open modal.
  const selectedTask = selectedTaskId ? tasks[selectedTaskId] ?? null : null;
  // dnd-kit's pointerup triggers a trailing click on the card the pointer is
  // over; skip one modal-open after a real drag.
  const justDragged = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setLoading(true);
        const [boardRes, tasksRes, usersRes] = await Promise.all([
          fetch(`/api/boards/${boardId}`),
          fetch(`/api/boards/${boardId}/tasks`),
          fetch(`/api/users`)
        ]);

        const board = await boardRes.json();
        const tasksArray = await tasksRes.json();
        const usersArray = await usersRes.json();

        setCurrentBoard(boardId);
        setColumns(board.columns);
        setUsers(usersArray);

        // Keep the boards list in sync so the Header/title show the board
        // name even when landing on this page directly.
        setBoards(
          boards.some((b) => b.id === board.id)
            ? boards.map((b) => (b.id === board.id ? board : b))
            : [...boards, board]
        );

        const tasksRecord: Record<string, Task> = {};
        tasksArray.forEach((task: Task) => {
          tasksRecord[task.id] = task;
        });
        setTasks(tasksRecord);

      } catch (error) {
        console.error("Failed to fetch board data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoardData();

    // Setup Realtime Listeners for this board
    socket.on("task:moved", (data) => {
      // In a real app, we would update the Zustand store here 
      // to reflect the movement of tasks across the board.
      console.log("Realtime task move received:", data);
    });

    return () => {
      socket.off("task:moved");
    };
  }, [boardId, setColumns, setTasks, setCurrentBoard]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const taskId = active.id as string;
    setActiveTask(tasks[taskId]);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks[activeId];
    if (!activeTask) return;

    const activeColumn = columns.find(col => col.taskIds.includes(activeId));
    if (!activeColumn) return;

    const overColumn = columns.find(col => col.id === overId || col.taskIds.includes(overId));
    if (!overColumn) return;

    if (activeColumn.id !== overColumn.id) {
      setColumns(prev => prev.map(col => {
        if (col.id === activeColumn.id) {
          return { ...col, taskIds: col.taskIds.filter(id => id !== activeId) };
        }
        if (col.id === overColumn.id) {
          return { ...col, taskIds: [...col.taskIds, activeId] };
        }
        return col;
      }));

      setTasks(prev => ({
        ...prev,
        [activeId]: { ...activeTask, columnId: overColumn.id }
      }));
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveTask(null);
    justDragged.current = true;
    setTimeout(() => { justDragged.current = false; }, 100);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = columns.find(col => col.taskIds.includes(activeId));
    const overColumn = columns.find(col => col.id === overId || col.taskIds.includes(overId));

    if (activeColumn && overColumn) {
      const oldIndex = activeColumn.taskIds.indexOf(activeId);
      const newIndex = overColumn.taskIds.indexOf(overId);
      const updatedTaskIds = overColumn.taskIds.includes(activeId) 
        ? arrayMove(overColumn.taskIds, oldIndex, newIndex)
        : [...overColumn.taskIds, activeId];

      setColumns(prev => prev.map(col => 
        col.id === overColumn.id ? { ...col, taskIds: updatedTaskIds } : col
      ));

      try {
        // 1. API Sync
        await fetch(`/api/tasks/${activeId}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            columnId: overColumn.id, 
            order: updatedTaskIds.indexOf(activeId) 
          })
        });

        // 2. Realtime Broadcast
        socket.emit("task:move", { 
          taskId: activeId, 
          columnId: overColumn.id, 
          order: updatedTaskIds.indexOf(activeId), 
          boardId 
        });
      } catch (e) {
        console.error("Failed to sync task move:", e);
      }
    }
  };

  const openTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = async (updatedTask: Partial<Task>) => {
    if (!selectedTask) return;
    
    setTasks(prev => ({
      ...prev,
      [selectedTask.id]: { ...selectedTask, ...updatedTask }
    }));

    try {
      await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
      
      socket.emit("task:update", { 
        taskId: selectedTask.id, 
        updates: updatedTask, 
        boardId 
      });
    } catch (e) {
      console.error("Failed to update task:", e);
    }
  };

  const openCreateTask = (columnId: string) => {
    setCreateColumnId(columnId);
    setSelectedTaskId(null);
    setIsModalOpen(true);
  };

  const handleTaskCreate = async (data: Partial<Task>) => {
    if (!createColumnId) return;
    try {
      const response = await fetch(`/api/boards/${boardId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, columnId: createColumnId, reporterId: 'u1' })
      });
      const newTask: Task = await response.json();

      setTasks(prev => ({ ...prev, [newTask.id]: newTask }));
      setColumns(prev =>
        prev.map(col =>
          col.id === createColumnId ? { ...col, taskIds: [...col.taskIds, newTask.id] } : col
        )
      );

      setIsModalOpen(false);
      setCreateColumnId(null);
    } catch (e) {
      console.error("Failed to create task:", e);
    }
  };

  const handleAddColumn = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Column', order: columns.length })
      });
      const newColumn: Column = await response.json();
      setColumns(prev => [...prev, newColumn]);
    } catch (e) {
      console.error("Failed to add column:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentBoard = boards.find(b => b.id === boardId);

  const filterTasks = (taskId: string) => {
    const task = tasks[taskId];
    if (!task) return false;

    const matchesSearch = task.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(filters.searchQuery.toLowerCase());
    const matchesAssignee = filters.assigneeId === 'all' || task.assigneeId === filters.assigneeId;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;

    return matchesSearch && matchesAssignee && matchesPriority;
  };

  return (
    <div className="flex flex-col h-full w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-3 h-8 rounded-full" 
            style={{ backgroundColor: currentBoard?.color || '#cbd5e1' }}
          />
          <h1 data-testid="board-heading" className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {currentBoard?.name || "Board"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="share-button">Share</Button>
          <Button size="sm" className="gap-2" data-testid="add-task-button" onClick={() => openCreateTask(columns[0]?.id ?? '')}>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      <FilterBar />

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 items-start">
          {columns.map((column) => (
            <div
              key={column.id}
              data-testid={`column-${column.id}`}
              className="flex-shrink-0 w-80 flex flex-col bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <h3 data-testid={`column-title-${column.id}`} className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    {column.name}
                  </h3>
                  <span className="text-xs font-medium px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500">
                    {column.taskIds.filter(filterTasks).length}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`column-menu-${column.id}`}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <SortableContext items={column.taskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {column.taskIds.filter(filterTasks).map((taskId) => {
                    const task = tasks[taskId];
                    if (!task) return null;
                    return (
                      <div
                        key={taskId}
                        data-testid={`task-${taskId}`}
                        onClick={() => {
                          if (justDragged.current) { justDragged.current = false; return; }
                          openTask(task);
                        }}
                      >
                        <SortableTask task={task} />
                      </div>
                    );
                  })}
                  <Button variant="ghost" data-testid={`add-card-${column.id}`} className="w-full justify-start text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 gap-2 h-9 px-2" onClick={() => openCreateTask(column.id)}>
                    <Plus className="w-4 h-4" />
                    <span className="text-xs">Add card</span>
                  </Button>
                </div>
              </SortableContext>
            </div>
          ))}
          
          <Button
            variant="outline"
            data-testid="add-column-button"
            className="w-80 h-full min-h-[200px] border-dashed flex flex-col gap-2 text-zinc-500"
            onClick={handleAddColumn}
          >
            <Plus className="w-6 h-6" />
            <span>Add Column</span>
          </Button>
        </div>

        <DragOverlay>
          {activeTask ? (
            <SortableTask task={activeTask} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCreateColumnId(null);
        }}
        onUpdate={handleTaskUpdate}
        createColumnId={createColumnId}
        onCreate={handleTaskCreate}
      />
    </div>
  );
}

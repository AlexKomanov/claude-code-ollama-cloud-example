"use client";

import React, { useState, useEffect } from "react";
import { Task } from "@/types";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { X, MessageSquare, CheckSquare, Calendar, User as UserIcon, AlertCircle, Plus, Trash2 } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Partial<Task>) => void;
  /** When provided (and task is null) the modal acts in create mode for this column. */
  createColumnId?: string | null;
  onCreate: (newTask: Partial<Task>) => void;
}

export function TaskModal({ task, isOpen, onClose, onUpdate, createColumnId, onCreate }: TaskModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [newItemText, setNewItemText] = useState("");
  const users = useUserStore((s) => s.users);

  const isCreateMode = !task && isOpen && Boolean(createColumnId);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    values: (task ? {
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigneeId: task.assigneeId || "",
      dueDate: task.dueDate ? new Date(task.dueDate as unknown as string).toISOString().split('T')[0] : '',
    } : undefined) as TaskFormValues | undefined,
  });

  // The form carries dates as YYYY-MM-DD strings; the Task type stores Date.
  const toTaskUpdate = (data: TaskFormValues): Partial<Task> => ({
    title: data.title,
    description: data.description,
    priority: data.priority,
    assigneeId: data.assigneeId,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
  });

  const onSubmit = (data: TaskFormValues) => {
    onUpdate(toTaskUpdate(data));
    setIsEditing(false);
  };

  const updateChecklist = (checklist: Task["checklist"]) => {
    onUpdate({ checklist });
  };

  const addChecklistItem = () => {
    if (!task || !newItemText.trim()) return;
    const item: Task["checklist"][number] = {
      id: `item-${Date.now()}`,
      taskId: task.id,
      content: newItemText.trim(),
      completed: false,
      order: task.checklist.length,
    };
    updateChecklist([...task.checklist, item]);
    setNewItemText("");
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!task) return;
    updateChecklist(
      task.checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeChecklistItem = (itemId: string) => {
    if (!task) return;
    updateChecklist(task.checklist.filter((item) => item.id !== itemId));
  };

  // Reset editing state whenever the modal closes or the task changes.
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setActiveTab("details");
      setNewItemText("");
    }
  }, [isOpen]);

  if (!isOpen || (!task && !isCreateMode)) return null;

  const assignee = task ? users.find((u) => u.id === task.assigneeId) : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent data-testid="task-dialog" className="max-w-3xl h-[80vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {isCreateMode ? "Create Task" : "Task Details"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {!isCreateMode && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                data-testid="task-edit-button"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                Edit Task
              </Button>
            )}
            {(isEditing || isCreateMode) && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" data-testid="task-cancel-button" onClick={() => { setIsEditing(false); onClose(); }}>
                  {isCreateMode ? "Cancel" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  data-testid={isCreateMode ? "task-create-submit" : "task-save-button"}
                  onClick={
                    isCreateMode
                      ? handleSubmit((data) => onCreate(toTaskUpdate(data)))
                      : handleSubmit(onSubmit)
                  }
                >
                  {isCreateMode ? "Create Task" : "Save Changes"}
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" data-testid="task-close-button" onClick={onClose} className="rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger
                value="details"
                data-testid="tab-details"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent px-0 py-2"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Details
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                data-testid="tab-comments"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent px-0 py-2"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="checklist"
                data-testid="tab-checklist"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent px-0 py-2"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Checklist
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {(isEditing || isCreateMode) && (
            <TabsContent value="details" className="flex-1 p-6 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      data-testid="task-title-input"
                      {...register("title")}
                      className={cn(errors.title && "border-red-500")}
                      autoFocus={isCreateMode}
                    />
                    {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <select
                        {...register("priority")}
                        data-testid="task-priority-select"
                        className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignee">Assignee</Label>
                      <select
                        id="assignee"
                        {...register("assigneeId")}
                        data-testid="task-assignee-select"
                        className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" data-testid="task-duedate-input" {...register("dueDate")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      data-testid="task-description-input"
                      {...register("description")}
                      className="w-full min-h-[150px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </form>
              </ScrollArea>
            </TabsContent>
          )}

          {!isEditing && !isCreateMode && task && (
            <TabsContent value="details" className="flex-1 p-6 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{task.title}</h2>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {task.priority}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-zinc-500">
                          <UserIcon className="w-4 h-4" />
                          <span>{assignee ? assignee.name : "Unassigned"}</span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-zinc-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(task.dueDate as unknown as string).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-500">Description</Label>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {task.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {!isEditing && !isCreateMode && task && (
            <TabsContent value="checklist" className="flex-1 p-6 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Checklist</h3>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an item..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addChecklistItem();
                          }
                        }}
                        className="flex-1"
                        data-testid="checklist-new-item"
                      />
                      <Button variant="outline" size="sm" className="gap-1" data-testid="checklist-add-button" onClick={addChecklistItem}>
                        <Plus className="w-3 h-3" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {task.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                        <input
                          type="checkbox"
                          data-testid={`checklist-item-${item.id}`}
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(item.id)}
                          className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={cn("text-sm", item.completed && "line-through text-zinc-400")}>
                          {item.content}
                        </span>
                        <button
                          type="button"
                          data-testid={`checklist-item-delete-${item.id}`}
                          onClick={() => removeChecklistItem(item.id)}
                          className="ml-auto text-zinc-400 hover:text-red-500"
                          aria-label={`Delete checklist item ${item.content}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {task.checklist.length === 0 && (
                      <p className="text-sm text-zinc-500 italic">No checklist items yet.</p>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {!isEditing && !isCreateMode && task && (
            <TabsContent value="comments" className="flex-1 p-6 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    {/* Comments would be mapped here */}
                    <p className="text-sm text-zinc-500 italic">No comments yet. Be the first to start the conversation!</p>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Input placeholder="Add a comment..." className="flex-1" data-testid="comment-input" />
                    <Button size="sm" data-testid="comment-post">Post</Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
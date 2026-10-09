"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Board } from "@/types";
import { useBoardStore } from "@/lib/stores/useBoardStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const COLORS = ["#3b82f6", "#10b981", "#a855f7", "#f97316", "#ef4444", "#14b8a6"];

const DEFAULT_COLUMNS = [
  { id: "col-backlog", boardId: "new", name: "Backlog", order: 0, color: "#f3f4f6", taskIds: [] },
  { id: "col-todo", boardId: "new", name: "To Do", order: 1, color: "#f3f4f6", taskIds: [] },
  { id: "col-inprogress", boardId: "new", name: "In Progress", order: 2, color: "#f3f4f6", taskIds: [] },
  { id: "col-done", boardId: "new", name: "Done", order: 3, color: "#f3f4f6", taskIds: [] },
];

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBoardModal({ isOpen, onClose }: CreateBoardModalProps) {
  const router = useRouter();
  const setBoards = useBoardStore((s) => s.setBoards);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Board name is required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          color,
          ownerId: "u1",
          memberIds: ["u1"],
          columns: DEFAULT_COLUMNS.map(({ boardId: _boardId, ...col }) => col),
        }),
      });
      if (!response.ok) throw new Error(`Create failed: ${response.status}`);
      const board: Board = await response.json();
      // The mock POST doesn't know the board id until now; backfill it.
      board.columns = board.columns?.map((col) => ({ ...col, boardId: board.id })) ?? [];
      setBoards((prev) => [...prev, board]);
      onClose();
      router.push(`/board/${board.id}`);
    } catch (e) {
      console.error("Failed to create board:", e);
      setError("Failed to create board. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setName("");
    setDescription("");
    setColor(COLORS[0]);
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md p-6 gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Create Board
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Name</Label>
            <Input
              id="board-name"
              data-testid="board-name-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Marketing"
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="board-desc">Description</Label>
            <Input
              id="board-desc"
              data-testid="board-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this board for?"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c, index) => (
                <button
                  key={c}
                  type="button"
                  data-testid={`color-swatch-${index + 1}`}
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-transform",
                    color === c && "ring-2 ring-offset-2 ring-zinc-500 dark:ring-offset-zinc-900 scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" data-testid="create-board-cancel" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button data-testid="create-board-submit" onClick={handleCreate} disabled={saving}>
            {saving ? "Creating..." : "Create Board"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
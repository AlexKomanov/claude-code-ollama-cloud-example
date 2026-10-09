"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoardStore } from "@/lib/stores/useBoardStore";
import { useUserStore } from "@/lib/stores/useUserStore";
import { isAdmin, canDeleteBoard } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, MoreVertical, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBoardModal } from "@/components/board/CreateBoardModal";

export default function BoardsPage() {
  const router = useRouter();
  const { boards, setBoards } = useBoardStore();
  const { currentUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch("/api/boards");
        const data = await response.json();
        setBoards(data);
      } catch (error) {
        console.error("Failed to fetch boards:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, [setBoards]);

  const handleDeleteBoard = async (id: string) => {
    if (!confirm("Are you sure you want to delete this board?")) return;
    try {
      await fetch(`/api/boards/${id}`, { method: 'DELETE' });
      setBoards(boards.filter(b => b.id !== id));
    } catch (e) {
      console.error("Failed to delete board:", e);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Boards</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your project workspaces</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)} data-testid="create-board-button">
          <Plus className="w-4 h-4" />
          Create Board
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.length === 0 && (
          <div data-testid="empty-state" className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <FolderKanban className="w-12 h-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No boards yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Get started by creating your first board</p>
            <Button variant="outline" onClick={() => setCreateOpen(true)} data-testid="empty-state-create-button">Create Your First Board</Button>
          </div>
        )}

        {boards.map((board) => (
          <div
            key={board.id}
            data-testid={`board-card-${board.id}`}
            className="group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/board/${board.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/board/${board.id}`);
              }
            }}
          >
            <Card className="p-6 h-48 flex flex-col justify-between hover:ring-2 hover:ring-blue-500 transition-all bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: board.color }}
              />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Link
                    href={`/board/${board.id}`}
                    className="font-bold text-xl text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors"
                    tabIndex={-1}
                  >
                    {board.name}
                  </Link>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {board.description}
                  </p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" className="h-8 w-8 p-0" />}
                    data-testid={`board-menu-${board.id}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`board-menu-edit-${board.id}`}>Edit Board</DropdownMenuItem>
                    {canDeleteBoard(currentUser) && (
                      <DropdownMenuItem
                        data-testid={`board-menu-delete-${board.id}`}
                        className="text-red-600"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteBoard(board.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Board
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex -space-x-2">
                  {board.memberIds.slice(0, 3).map((id, i) => (
                    <div 
                      key={id} 
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-medium"
                    >
                      {id.slice(1).toUpperCase()}
                    </div>
                  ))}
                  {board.memberIds.length > 3 && (
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-500">
                      +{board.memberIds.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                  {board.columns.length} Columns
                </span>
              </div>
            </Card>
          </div>
        ))}
      </div >

      <CreateBoardModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

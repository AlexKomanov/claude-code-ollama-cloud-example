import { NextResponse } from "next/server";
import { MOCK_TASKS, MOCK_BOARDS } from "@/lib/mocks/mockData";
import { Task } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks = Object.values(MOCK_TASKS).filter(t => t.boardId === id);
  return NextResponse.json(tasks);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const task: Task = {
    id: `t${Date.now()}`,
    boardId: id,
    columnId: body.columnId,
    title: body.title || "Untitled task",
    description: body.description || "",
    order: 0,
    priority: body.priority || "medium",
    assigneeId: body.assigneeId || undefined,
    reporterId: body.reporterId || "u1",
    labelIds: [],
    checklist: [],
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  MOCK_TASKS[task.id] = task;

  const board = MOCK_BOARDS.find(b => b.id === id);
  const column = board?.columns.find(c => c.id === task.columnId);
  if (column) column.taskIds.push(task.id);

  return NextResponse.json(task, { status: 201 });
}
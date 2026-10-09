import { NextResponse } from "next/server";
import { Column } from "@/types";
import { MOCK_BOARDS } from "@/lib/mocks/mockData";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const board = MOCK_BOARDS.find(b => b.id === id);
  if (!board) return new NextResponse(null, { status: 404 });

  const body = await request.json();
  const column: Column = {
    id: `col-${Date.now()}`,
    boardId: board.id,
    name: body.name || "New Column",
    order: body.order ?? board.columns.length,
    color: body.color || "#f3f4f6",
    taskIds: [],
  };

  board.columns.push(column);
  board.updatedAt = new Date();

  return NextResponse.json(column, { status: 201 });
}
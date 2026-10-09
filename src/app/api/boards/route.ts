import { NextResponse } from "next/server";
import { MOCK_BOARDS } from "@/lib/mocks/mockData";

export async function GET() {
  return NextResponse.json(MOCK_BOARDS);
}

export async function POST(request: Request) {
  const body = await request.json();
  const board = {
    ...body,
    id: `b${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  // Columns created alongside the board belong to it now that the id exists.
  if (board.columns) {
    board.columns = board.columns.map((c: Record<string, unknown>) => ({ ...c, boardId: board.id }));
  }
  MOCK_BOARDS.push(board as (typeof MOCK_BOARDS)[number]);
  return NextResponse.json(board, { status: 201 });
}
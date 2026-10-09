import { NextResponse } from "next/server";
import { MOCK_BOARDS, MOCK_TASKS } from "@/lib/mocks/mockData";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const board = MOCK_BOARDS.find(b => b.id === id);
  if (!board) return new NextResponse(null, { status: 404 });
  return NextResponse.json(board);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = MOCK_BOARDS.findIndex(b => b.id === id);
  if (index === -1) return new NextResponse(null, { status: 404 });

  MOCK_BOARDS.splice(index, 1);
  // Also drop the board's tasks from the mock store.
  for (const [taskId, task] of Object.entries(MOCK_TASKS)) {
    if (task.boardId === id) delete MOCK_TASKS[taskId];
  }
  return new NextResponse(null, { status: 204 });
}
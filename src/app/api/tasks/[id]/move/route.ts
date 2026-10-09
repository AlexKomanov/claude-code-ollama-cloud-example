import { NextResponse } from "next/server";
import { MOCK_TASKS, MOCK_BOARDS } from "@/lib/mocks/mockData";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = MOCK_TASKS[id];
  if (!task) return new NextResponse(null, { status: 404 });
  const { columnId, order } = await request.json();

  const previousColumnId = task.columnId;

  // Remove from the old column, insert into the new one at the given order.
  for (const board of MOCK_BOARDS) {
    for (const column of board.columns) {
      column.taskIds = column.taskIds.filter(tid => tid !== id);
    }
  }
  const board = MOCK_BOARDS.find(b => b.id === task.boardId);
  const targetColumn = board?.columns.find(c => c.id === columnId);
  if (targetColumn) {
    const insertAt = typeof order === 'number' ? Math.min(order, targetColumn.taskIds.length) : targetColumn.taskIds.length;
    targetColumn.taskIds.splice(insertAt, 0, id);
  }

  const updated = { ...task, columnId, updatedAt: new Date() };
  MOCK_TASKS[id] = updated;

  return NextResponse.json(updated);
}
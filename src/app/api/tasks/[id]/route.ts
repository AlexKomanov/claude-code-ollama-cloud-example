import { NextResponse } from "next/server";
import { MOCK_TASKS } from "@/lib/mocks/mockData";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = MOCK_TASKS[id];
  if (!task) return new NextResponse(null, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = MOCK_TASKS[id];
  if (!task) return new NextResponse(null, { status: 404 });
  const updates = await request.json();
  const updated = { ...task, ...updates, updatedAt: new Date() };
  MOCK_TASKS[id] = updated;
  return NextResponse.json(updated);
}
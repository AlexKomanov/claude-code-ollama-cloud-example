import { expect, type Page, type APIRequestContext } from "@playwright/test";

/**
 * Shared helpers for the grouped e2e specs. Board/task/column ids are never
 * hardcoded to the mock seed: tests discover them at runtime (from the API or
 * the rendered data-testid attributes).
 */

type Board = { id: string; name: string; description?: string; memberIds?: string[]; columns: { id: string; taskIds: string[] }[] };
type Task = { id: string; title: string; description: string; columnId: string; assigneeId?: string; priority: string; boardId: string };
type User = { id: string; name: string };

/** Fetches boards through the request context (Node-side, same store as the UI when MSW is off). */
export async function getBoards(request: APIRequestContext): Promise<Board[]> {
  await expect(request.get("/api/boards")).resolves.toBeTruthy();
  const res = await request.get("/api/boards");
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as Board[];
}

export async function getBoardByName(request: APIRequestContext, name: string): Promise<Board> {
  const boards = await getBoards(request);
  const board = boards.find((b) => b.name === name);
  if (!board) throw new Error(`Board "${name}" not found in mock store`);
  return board;
}

export async function getTasks(request: APIRequestContext, boardId: string): Promise<Task[]> {
  const res = await request.get(`/api/boards/${boardId}/tasks`);
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as Task[];
}

export async function getUsers(request: APIRequestContext): Promise<User[]> {
  const res = await request.get("/api/users");
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as User[];
}

/** Restores the mock store to seed values via the test-only reset route. */
export async function resetMocks(context: { request: APIRequestContext } | APIRequestContext): Promise<void> {
  const request: APIRequestContext = "request" in context ? context.request : (context as APIRequestContext);
  const res = await request.post("/api/mock-reset");
  expect(res.ok()).toBeTruthy();
}

export const boardCards = (page: Page) => page.locator('[data-testid^="board-card-"]');
export const boardColumn = (page: Page, columnId: string) => page.getByTestId(`column-${columnId}`);
export const taskCard = (page: Page, taskId: string) => page.getByTestId(`task-card-${taskId}`);

/** Column header count badge (the pill next to the column title). */
export function columnCountBadge(page: Page, columnId: string) {
  return page.getByTestId(`column-${columnId}`).locator('[data-testid^="column-title-"] ~ span');
}

/**
 * Drags a task card by its grip handle to the given target (a column or a
 * card) using raw mouse steps, since dnd-kit's PointerSensor needs a real
 * pointer sequence with a 5px activation distance.
 */
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export async function dragByTask(
  page: Page,
  taskId: string,
  targetTestId: string,
): Promise<void> {
  const grip = page.getByTestId(`task-grip-${taskId}`);
  const target = page.getByTestId(targetTestId);

  // Keep drop points this far from the viewport edges: on narrow mobile
  // viewports the board scrolls horizontally and dnd-kit auto-scrolls when the
  // pointer hovers near the scroller's edge, which drops the card over the
  // wrong column. A drop point must land inside the target's box AND within a
  // safe inset; if that area doesn't exist on-screen, bring the target into
  // view and recompute.
  const INSET = 44;
  let tb = await target.boundingBox();
  expect(tb).toBeTruthy();
  let usable = { l: Math.max(tb!.x, INSET), r: Math.min(tb!.x + tb!.width, (await page.viewportSize())!.width - INSET) };
  if (usable.l >= usable.r) {
    await target.scrollIntoViewIfNeeded();
    tb = await target.boundingBox();
    expect(tb).toBeTruthy();
    usable = { l: Math.max(tb!.x, INSET), r: Math.min(tb!.x + tb!.width, (await page.viewportSize())!.width - INSET) };
  }

  const gb = await grip.boundingBox();
  expect(gb).toBeTruthy();

  const startX = clamp(gb!.x + gb!.width / 2, 2, (await page.viewportSize())!.width - 2);
  const startY = clamp(gb!.y + gb!.height / 2, 2, (await page.viewportSize())!.height - 2);
  const endX = (usable.l + usable.r) / 2;
  const endY = clamp(tb!.y + tb!.height / 2, INSET, (await page.viewportSize())!.height - INSET);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  const STEPS = 12;
  for (let i = 1; i <= STEPS; i++) {
    await page.mouse.move(
      startX + ((endX - startX) * i) / STEPS,
      startY + ((endY - startY) * i) / STEPS,
    );
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  // dnd-kit fires a trailing click after pointerup; let the drag settle first.
  await page.waitForTimeout(200);
}
import { test, expect } from "@playwright/test";
import { resetMocks } from "./helpers";

/**
 * Combined API + UI tests in the same file: one side acts, the other verifies.
 * The test server runs without MSW (NEXT_PUBLIC_ENABLE_MSW=false), so browser
 * fetches and Playwright's request context both read/write the same mock store.
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});
test.afterEach(async ({ page }) => {
  await resetMocks(page);
});

test("a task created via the API appears in the UI", async ({ request, page }) => {
  // Arrange: board with one task, both created through the API.
  const boards = await (await request.get("/api/boards")).json();
  const boardId = boards[0].id;
  const columnId = boards[0].columns[0].id;
  const title = `API-then-UI task ${Date.now()}`;
  const created = await request.post(`/api/boards/${boardId}/tasks`, {
    data: { columnId, title },
  });
  expect(created.status()).toBe(201);
  const taskId = (await created.json()).id;

  // Act + assert: the browser sees what the API created.
  await page.goto(`/board/${boardId}`);
  await expect(page.getByTestId("board-heading")).toBeVisible();
  await expect(page.getByTestId(`task-card-${taskId}`)).toContainText(title);
});

test("a board created in the UI is retrievable via the API", async ({ page, request }) => {
  await page.goto("/boards");
  const name = `UI-then-API board ${Date.now()}`;
  await page.getByTestId("create-board-button").click();
  await page.getByTestId("board-name-input").fill(name);
  await page.getByTestId("create-board-submit").click();
  await expect(page).toHaveURL(/\/board\/b\d+/);
  const boardId = page.url().match(/\/board\/(b\d+)/)![1];
  await expect(page.getByTestId("board-heading")).toHaveText(name);

  const fetched = await (await request.get(`/api/boards/${boardId}`)).json();
  expect(fetched.name).toBe(name);
  expect(fetched.columns.length).toBe(4);

  // Clean up.
  await request.delete(`/api/boards/${boardId}`);
});

test("a task edited in the UI persists through the API", async ({ page, request }) => {
  const boards = await (await request.get("/api/boards")).json();
  const boardId = boards[0].id;
  const tasks = await (await request.get(`/api/boards/${boardId}/tasks`)).json();
  test.skip(tasks.length === 0, "no seeded tasks on this board");
  const taskId = tasks[0].id;

  await page.goto(`/board/${boardId}`);
  await page.getByTestId(`task-card-${taskId}`).click();
  await page.getByTestId("task-edit-button").click();
  const newTitle = `UI-edited ${Date.now()}`;
  await page.getByTestId("task-title-input").fill(newTitle);
  await page.getByTestId("task-save-button").click();

  await expect(page.getByTestId(`task-card-${taskId}`)).toContainText(newTitle, { timeout: 5000 });
  // Poll in case the POST/PATCH round-trip lagged behind the optimistic UI update.
  await expect.poll(async () => {
    const r = await request.get(`/api/tasks/${taskId}`);
    return (await r.json()).title;
  }).toBe(newTitle);
});

test("a task moved via the API lands in the right UI column", async ({ page, request }) => {
  const boards = await (await request.get("/api/boards")).json();
  const board = boards.find((b: { columns: unknown[] }) => b.columns.length >= 2);
  test.skip(!board, "no board with >= 2 columns");
  const tasks = await (await request.get(`/api/boards/${board.id}/tasks`)).json();
  test.skip(tasks.length === 0, "no seeded tasks on this board");
  const targetColumnId = board.columns[1].id;

  const moved = await request.patch(`/api/tasks/${tasks[0].id}/move`, {
    data: { columnId: targetColumnId, order: 0 },
  });
  expect(moved.status()).toBe(200);

  await page.goto(`/board/${board.id}`);
  const destination = page.getByTestId(`column-${targetColumnId}`);
  await expect(destination.locator(`[data-testid=task-card-${tasks[0].id}]`)).toBeVisible();
});
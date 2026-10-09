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
  let boardId = "";
  let taskId = "";
  const title = `API-then-UI task ${Date.now()}`;

  await test.step("create a board task through the API (POST /tasks)", async () => {
    const boards = await (await request.get("/api/boards")).json();
    boardId = boards[0].id;
    const columnId = boards[0].columns[0].id;
    const created = await request.post(`/api/boards/${boardId}/tasks`, {
      data: { columnId, title },
    });
    expect(created.status()).toBe(201);
    taskId = (await created.json()).id;
  });
  await test.step("open the board page in the browser", async () => {
    await page.goto(`/board/${boardId}`);
    await expect(page.getByTestId("board-heading")).toBeVisible();
  });
  await test.step("the UI shows the task the API created", async () => {
    await expect(page.getByTestId(`task-card-${taskId}`)).toContainText(title);
  });
});

test("a board created in the UI is retrievable via the API", async ({ page, request }) => {
  let boardId = "";
  const name = `UI-then-API board ${Date.now()}`;

  await test.step("create a board in the UI", async () => {
    await page.goto("/boards");
    await page.getByTestId("create-board-button").click();
    await page.getByTestId("board-name-input").fill(name);
    await page.getByTestId("create-board-submit").click();
    await expect(page).toHaveURL(/\/board\/b\d+/);
    boardId = page.url().match(/\/board\/(b\d+)/)![1];
    await expect(page.getByTestId("board-heading")).toHaveText(name);
  });
  await test.step("the API returns it with the four default columns", async () => {
    const fetched = await (await request.get(`/api/boards/${boardId}`)).json();
    expect(fetched.name).toBe(name);
    expect(fetched.columns.length).toBe(4);
  });
  await test.step("cleanup: DELETE it via the API", async () => {
    await request.delete(`/api/boards/${boardId}`);
  });
});

test("a task edited in the UI persists through the API", async ({ page, request }) => {
  let taskId = "";
  const newTitle = `UI-edited ${Date.now()}`;

  await test.step("open the first seeded task in edit mode (skip when empty)", async () => {
    const boards = await (await request.get("/api/boards")).json();
    const boardId = boards[0].id;
    const tasks = await (await request.get(`/api/boards/${boardId}/tasks`)).json();
    test.skip(tasks.length === 0, "no seeded tasks on this board");
    taskId = tasks[0].id;
    await page.goto(`/board/${boardId}`);
    await page.getByTestId(`task-card-${taskId}`).click();
    await page.getByTestId("task-edit-button").click();
  });
  await test.step("rename the title and save", async () => {
    await page.getByTestId("task-title-input").fill(newTitle);
    await page.getByTestId("task-save-button").click();
  });
  await test.step("the card shows it and GET /api/tasks/:id confirms", async () => {
    await expect(page.getByTestId(`task-card-${taskId}`)).toContainText(newTitle, { timeout: 5000 });
    // Poll in case the POST/PATCH round-trip lagged behind the optimistic UI update.
    await expect.poll(async () => {
      const r = await request.get(`/api/tasks/${taskId}`);
      return (await r.json()).title;
    }).toBe(newTitle);
  });
});

test("a task moved via the API lands in the right UI column", async ({ page, request }) => {
  let boardId = "";
  let taskId = "";
  let targetColumnId = "";

  await test.step("move a seeded task via PATCH /move (skip without two columns)", async () => {
    const boards = await (await request.get("/api/boards")).json();
    const board = boards.find((b: { columns: unknown[] }) => b.columns.length >= 2);
    test.skip(!board, "no board with >= 2 columns");
    boardId = board.id;
    targetColumnId = board.columns[1].id;
    const tasks = await (await request.get(`/api/boards/${boardId}/tasks`)).json();
    test.skip(tasks.length === 0, "no seeded tasks on this board");
    taskId = tasks[0].id;
    const moved = await request.patch(`/api/tasks/${taskId}/move`, {
      data: { columnId: targetColumnId, order: 0 },
    });
    expect(moved.status()).toBe(200);
  });
  await test.step("open the board in the browser", async () => {
    await page.goto(`/board/${boardId}`);
  });
  await test.step("the task card sits in the destination column", async () => {
    const destination = page.getByTestId(`column-${targetColumnId}`);
    await expect(destination.locator(`[data-testid=task-card-${taskId}]`)).toBeVisible();
  });
});
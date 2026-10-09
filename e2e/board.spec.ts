import { test, expect } from "@playwright/test";
import {
  resetMocks, getBoardByName, getTasks, boardColumn, taskCard, dragByTask, columnCountBadge,
} from "./helpers";

/**
 * Board Page tests (TEST_PLAN §3: BRD-01..12 on Engineering, §5: BRD2-01..02
 * on Design). Tests run serially (workers: 1) against the shared mock store;
 * state is reset via @see resetMocks.
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});
test.afterEach(async ({ page }) => {
  await resetMocks(page);
});

test.describe("Engineering board (b1 seed)", () => {
  test("BRD-01: load board page with 5 columns", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    await expect(page.getByTestId("board-heading")).toHaveText("Engineering");
    await expect(page.getByTestId(`column-${board.columns[0].id}`)).toBeVisible();
    const names = await page.locator('[data-testid^="column-title-"]').allTextContents();
    expect(names).toEqual(["Backlog", "To Do", "In Progress", "In Review", "Done"]);
  });

  test("BRD-02: column task counts from the seed", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    const counts = board.columns.map((c) => c.taskIds.length);
    for (let i = 0; i < counts.length; i++) {
      await expect(columnCountBadge(page, board.columns[i].id)).toHaveText(String(counts[i]));
    }
  });

  test("BRD-03: task cards show title, priority badge and assignee avatar", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    const tasks = await getTasks(page.request, board.id);
    expect(tasks.length).toBeGreaterThan(0);

    const first = tasks[0];
    const card = taskCard(page, first.id);
    await expect(card).toContainText(first.title);
    await expect(card.getByTestId(`task-priority-${first.id}`)).toHaveText(first.priority);
    await expect(card.getByTestId(`task-avatar-${first.id}`)).toBeVisible();
  });

  test("BRD-04: dragging a task between columns moves it visually and via the API", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    const tasks = await getTasks(page.request, board.id);
    const backColumn = board.columns[0]; // Backlog: [t1 "Implement Auth Flow", t2]
    const todoColumn = board.columns[1]; // To Do
    const dragged = tasks.find((t) => t.title === "Implement Auth Flow")!;
    expect(dragged.columnId).toBe(backColumn.id);

    await page.goto(`/board/${board.id}`);
    await dragByTask(page, dragged.id, `column-${todoColumn.id}`);

    await expect(boardColumn(page, todoColumn.id).locator(`[data-testid=task-card-${dragged.id}]`)).toBeVisible();
    // The UI issues the move PATCH asynchronously after the visual move; poll.
    await expect
      .poll(async () => {
        const boardAfter = await (await page.request.get(`/api/boards/${board.id}`)).json();
        return boardAfter.columns.find((c: { id: string }) => c.id === todoColumn.id).taskIds as string[];
      })
      .toContain(dragged.id);
  });

  test("BRD-05: dragging within a column reorders it", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    const backColumn = board.columns[0];
    const [firstId, secondId] = backColumn.taskIds;
    if (!secondId) test.skip(true, "backlog needs 2+ tasks to reorder");

    await page.goto(`/board/${board.id}`);
    // Drag the first card onto the second card's position.
    await dragByTask(page, firstId, `task-card-${secondId}`);

    const boardAfter = (await (await page.request.get(`/api/boards/${board.id}`)).json());
    const after = boardAfter.columns.find((c: { id: string }) => c.id === backColumn.id).taskIds as string[];
    expect(after).toContain(firstId);
    expect(after.indexOf(firstId)).not.toBe(0);
  });

  test("BRD-06: Add Task opens the create-task modal", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    await page.getByTestId("add-task-button").click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
    await expect(page.getByTestId("task-title-input")).toBeFocused();
  });

  test("BRD-07: clicking an existing task opens its details", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    const tasks = await getTasks(page.request, board.id);
    const first = tasks[0];
    await page.goto(`/board/${board.id}`);
    await taskCard(page, first.id).click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
    // Details view shows the task title and description.
    await expect(page.getByTestId("task-dialog")).toContainText(first.title);
    await expect(page.getByTestId("task-dialog")).toContainText(first.description.slice(0, 30));
  });

  test("BRD-08: search filter narrows tasks", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    const tasks = await getTasks(page.request, board.id);
    const authTask = tasks.find((t) => t.title.includes("Auth"))!;

    await page.getByTestId("filter-search").fill("Auth");
    await expect(taskCard(page, authTask.id)).toBeVisible();
    for (const t of tasks.filter((t) => !t.title.includes("Auth"))) {
      await expect(taskCard(page, t.id)).toHaveCount(0);
    }
  });

  test("BRD-09: assignee filter shows only that user's tasks", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    const tasks = await getTasks(page.request, board.id);
    const users = await (await page.request.get("/api/users")).json();
    const u2 = (users as { id: string; name: string }[]).find((u) => u.name === "John Developer")!.id;

    await page.getByTestId("filter-assignee").click();
    await page.getByTestId(`filter-assignee-${u2}`).click();
    for (const t of tasks.filter((t) => t.assigneeId === u2)) {
      await expect(taskCard(page, t.id)).toBeVisible();
    }
    for (const t of tasks.filter((t) => t.assigneeId !== u2)) {
      await expect(taskCard(page, t.id)).toHaveCount(0);
    }
  });

  test("BRD-10: priority filter shows only matching tasks", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    const tasks = await getTasks(page.request, board.id);

    await page.getByTestId("filter-priority").click();
    await page.getByTestId("filter-priority-critical").click();
    for (const t of tasks.filter((t) => t.priority === "critical")) {
      await expect(taskCard(page, t.id)).toBeVisible();
    }
    for (const t of tasks.filter((t) => t.priority !== "critical")) {
      await expect(taskCard(page, t.id)).toHaveCount(0);
    }
  });

  test("BRD-11: Clear restores all tasks", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    const tasks = await getTasks(page.request, board.id);

    await page.getByTestId("filter-search").fill("Auth");
    await page.getByTestId("filter-clear").click();
    await expect(page.getByTestId("filter-search")).toHaveValue("");
    for (const t of tasks) {
      await expect(taskCard(page, t.id)).toBeVisible();
    }
  });

  test("BRD-12: Add Column appends a new column", async ({ page }) => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    await expect(page.getByTestId("board-heading")).toBeVisible();
    // Count real column containers only (column-N, not column-title-N/column-menu-N).
    const columnContainers = page.locator('[data-testid^="column-"]:not([data-testid^="column-title-"]):not([data-testid^="column-menu-"])');
    await expect(columnContainers).toHaveCount(board.columns.length);
    await page.getByTestId("add-column-button").click();
    await expect(columnContainers).toHaveCount(board.columns.length + 1);
    await expect(page.getByText("New Column")).toBeVisible();
  });
});

test.describe("Design board (b2 seed)", () => {
  test("BRD2-01: load Design board with empty columns", async ({ page }) => {
    const board = await getBoardByName(page.request, "Design");
    await page.goto(`/board/${board.id}`);
    await expect(page.getByTestId("board-heading")).toHaveText("Design");
    expect(board.columns.map((c) => c.id)).toEqual(["d1", "d2", "d3"]);
    for (const column of board.columns) {
      await expect(boardColumn(page, column.id)).toBeVisible();
      await expect(boardColumn(page, column.id).locator('[data-testid^="task-card-"]')).toHaveCount(0);
    }
  });

  test("BRD2-02: Add card creates a task in the empty column", async ({ page }) => {
    const board = await getBoardByName(page.request, "Design");
    await page.goto(`/board/${board.id}`);
    const first = board.columns[0];
    const title = `Design task ${Date.now()}`;

    await page.getByTestId(`add-card-${first.id}`).click();
    await page.getByTestId("task-title-input").fill(title);
    await page.getByTestId("task-create-submit").click();

    const tasks = await getTasks(page.request, board.id);
    const created = tasks.find((t) => t.title === title)!;
    await expect(taskCard(page, created.id)).toContainText(title);
    await expect(boardColumn(page, first.id).locator(`[data-testid=task-card-${created.id}]`)).toBeVisible();
  });
});
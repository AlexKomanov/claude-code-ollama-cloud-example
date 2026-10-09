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
    await test.step("open the Engineering board (id discovered via the API)", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      await page.goto(`/board/${board.id}`);
    });
    await test.step("heading and first column are visible", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      await expect(page.getByTestId("board-heading")).toHaveText("Engineering");
      await expect(page.getByTestId(`column-${board.columns[0].id}`)).toBeVisible();
    });
    await test.step("the five seeded columns render in order", async () => {
      const names = await page.locator('[data-testid^="column-title-"]').allTextContents();
      expect(names).toEqual(["Backlog", "To Do", "In Progress", "In Review", "Done"]);
    });
  });

  test("BRD-02: column task counts from the seed", async ({ page }) => {
    await test.step("open the Engineering board", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      await page.goto(`/board/${board.id}`);
    });
    await test.step("each column badge shows the seeded task count", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      const counts = board.columns.map((c) => c.taskIds.length);
      for (let i = 0; i < counts.length; i++) {
        await expect(columnCountBadge(page, board.columns[i].id)).toHaveText(String(counts[i]));
      }
    });
  });

  test("BRD-03: task cards show title, priority badge and assignee avatar", async ({ page }) => {
    let board: Awaited<ReturnType<typeof getBoardByName>>;
    await test.step("open the Engineering board and read its tasks", async () => {
      board = await getBoardByName(page.request, "Engineering");
      await page.goto(`/board/${board.id}`);
      const tasks = await getTasks(page.request, board.id);
      expect(tasks.length).toBeGreaterThan(0);
    });
    await test.step("the first card shows its title, priority badge and avatar", async () => {
      const first = (await getTasks(page.request, board!.id))[0];
      const card = taskCard(page, first.id);
      await expect(card).toContainText(first.title);
      await expect(card.getByTestId(`task-priority-${first.id}`)).toHaveText(first.priority);
      await expect(card.getByTestId(`task-avatar-${first.id}`)).toBeVisible();
    });
  });

  test("BRD-04: dragging a task between columns moves it visually and via the API", async ({ page }) => {
    let dragged: { id: string; columnId: string };
    let todoColumnId: string;
    await test.step("locate 'Implement Auth Flow' in Backlog (seed)", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      const tasks = await getTasks(page.request, board.id);
      todoColumnId = board.columns[1].id; // To Do
      dragged = tasks.find((t) => t.title === "Implement Auth Flow")!;
      expect(dragged.columnId).toBe(board.columns[0].id);
    });
    await test.step("open the board and drag the card to To Do", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      await page.goto(`/board/${board.id}`);
      await dragByTask(page, dragged.id, `column-${todoColumnId}`);
    });
    await test.step("the card is visible in the To Do column", async () => {
      await expect(boardColumn(page, todoColumnId).locator(`[data-testid=task-card-${dragged.id}]`)).toBeVisible();
    });
    await test.step("the API reflects the move in the column's taskIds", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      // The UI issues the move PATCH asynchronously after the visual move; poll.
      await expect
        .poll(async () => {
          const boardAfter = await (await page.request.get(`/api/boards/${board.id}`)).json();
          return boardAfter.columns.find((c: { id: string }) => c.id === todoColumnId).taskIds as string[];
        })
        .toContain(dragged.id);
    });
  });

  test("BRD-05: dragging within a column reorders it", async ({ page }) => {
    let firstId = "";
    let secondId = "";
    let boardId = "";
    await test.step("pick the first two Backlog tasks (skip with 1 task)", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      boardId = board.id;
      const backColumn = board.columns[0];
      [firstId, secondId] = backColumn.taskIds;
      if (!secondId) test.skip(true, "backlog needs 2+ tasks to reorder");
    });
    await test.step("open the board and drag the first card onto the second", async () => {
      await page.goto(`/board/${boardId}`);
      await dragByTask(page, firstId, `task-card-${secondId}`);
    });
    await test.step("Backlog order is no longer the seeded order", async () => {
      const boardAfter = (await (await page.request.get(`/api/boards/${boardId}`)).json());
      const backColumnId = (await getBoardByName(page.request, "Engineering")).columns[0].id;
      const after = boardAfter.columns.find((c: { id: string }) => c.id === backColumnId).taskIds as string[];
      expect(after).toContain(firstId);
      expect(after.indexOf(firstId)).not.toBe(0);
    });
  });

  test("BRD-06: Add Task opens the create-task modal", async ({ page }) => {
    await test.step("open the Engineering board", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      await page.goto(`/board/${board.id}`);
    });
    await test.step("click Add Task", async () => {
      await page.getByTestId("add-task-button").click();
    });
    await test.step("dialog opens with a focused title input", async () => {
      await expect(page.getByTestId("task-dialog")).toBeVisible();
      await expect(page.getByTestId("task-title-input")).toBeFocused();
    });
  });

  test("BRD-07: clicking an existing task opens its details", async ({ page }) => {
    let first: { title: string; description: string };
    await test.step("open the Engineering board and pick the first task", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      first = (await getTasks(page.request, board.id))[0];
      await page.goto(`/board/${board.id}`);
    });
    await test.step("click the task card", async () => {
      await taskCard(page, first.id).click();
      await expect(page.getByTestId("task-dialog")).toBeVisible();
    });
    await test.step("details view shows the task title and description", async () => {
      await expect(page.getByTestId("task-dialog")).toContainText(first.title);
      await expect(page.getByTestId("task-dialog")).toContainText(first.description.slice(0, 30));
    });
  });

  test("BRD-08: search filter narrows tasks", async ({ page }) => {
    let tasks: { id: string; title: string }[] = [];
    await test.step("open the Engineering board", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      tasks = await getTasks(page.request, board.id);
      await page.goto(`/board/${board.id}`);
    });
    await test.step("type \"Auth\" in the search box", async () => {
      await page.getByTestId("filter-search").fill("Auth");
    });
    await test.step("only tasks whose title contains Auth remain visible", async () => {
      const authTask = tasks.find((t) => t.title.includes("Auth"))!;
      await expect(taskCard(page, authTask.id)).toBeVisible();
      for (const t of tasks.filter((t) => !t.title.includes("Auth"))) {
        await expect(taskCard(page, t.id)).toHaveCount(0);
      }
    });
  });

  test("BRD-09: assignee filter shows only that user's tasks", async ({ page }) => {
    let tasks: { id: string; assigneeId?: string }[] = [];
    let u2 = "";
    await test.step("open the Engineering board", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      tasks = await getTasks(page.request, board.id);
      await page.goto(`/board/${board.id}`);
    });
    await test.step("look up John Developer's id in /api/users", async () => {
      const users = await (await page.request.get("/api/users")).json();
      u2 = (users as { id: string; name: string }[]).find((u) => u.name === "John Developer")!.id;
    });
    await test.step("pick John Developer in the assignee filter", async () => {
      await page.getByTestId("filter-assignee").click();
      await page.getByTestId(`filter-assignee-${u2}`).click();
    });
    await test.step("only his tasks remain visible", async () => {
      for (const t of tasks.filter((t) => t.assigneeId === u2)) {
        await expect(taskCard(page, t.id)).toBeVisible();
      }
      for (const t of tasks.filter((t) => t.assigneeId !== u2)) {
        await expect(taskCard(page, t.id)).toHaveCount(0);
      }
    });
  });

  test("BRD-10: priority filter shows only matching tasks", async ({ page }) => {
    let tasks: { id: string; priority: string }[] = [];
    await test.step("open the Engineering board", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      tasks = await getTasks(page.request, board.id);
      await page.goto(`/board/${board.id}`);
    });
    await test.step("pick Critical in the priority filter", async () => {
      await page.getByTestId("filter-priority").click();
      await page.getByTestId("filter-priority-critical").click();
    });
    await test.step("only critical-priority tasks remain visible", async () => {
      for (const t of tasks.filter((t) => t.priority === "critical")) {
        await expect(taskCard(page, t.id)).toBeVisible();
      }
      for (const t of tasks.filter((t) => t.priority !== "critical")) {
        await expect(taskCard(page, t.id)).toHaveCount(0);
      }
    });
  });

  test("BRD-11: Clear restores all tasks", async ({ page }) => {
    let tasks: { id: string }[] = [];
    await test.step("open the Engineering board", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      tasks = await getTasks(page.request, board.id);
      await page.goto(`/board/${board.id}`);
    });
    await test.step("narrow the list with an \"Auth\" search", async () => {
      await page.getByTestId("filter-search").fill("Auth");
    });
    await test.step("click Clear — the search resets", async () => {
      await page.getByTestId("filter-clear").click();
      await expect(page.getByTestId("filter-search")).toHaveValue("");
    });
    await test.step("all task cards are visible again", async () => {
      for (const t of tasks) {
        await expect(taskCard(page, t.id)).toBeVisible();
      }
    });
  });

  test("BRD-12: Add Column appends a new column", async ({ page }) => {
    await test.step("open the Engineering board", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      await page.goto(`/board/${board.id}`);
      await expect(page.getByTestId("board-heading")).toBeVisible();
    });
    await test.step("count the rendered column containers", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      const columnContainers = page.locator('[data-testid^="column-"]:not([data-testid^="column-title-"]):not([data-testid^="column-menu-"])');
      await expect(columnContainers).toHaveCount(board.columns.length);
    });
    await test.step("Add Column appends a visible \"New Column\"", async () => {
      const board = await getBoardByName(page.request, "Engineering");
      const columnContainers = page.locator('[data-testid^="column-"]:not([data-testid^="column-title-"]):not([data-testid^="column-menu-"])');
      await page.getByTestId("add-column-button").click();
      await expect(columnContainers).toHaveCount(board.columns.length + 1);
      await expect(page.getByText("New Column")).toBeVisible();
    });
  });
});

test.describe("Design board (b2 seed)", () => {
  test("BRD2-01: load Design board with empty columns", async ({ page }) => {
    await test.step("open the Design board", async () => {
      const board = await getBoardByName(page.request, "Design");
      await page.goto(`/board/${board.id}`);
      await expect(page.getByTestId("board-heading")).toHaveText("Design");
    });
    await test.step("the three seeded columns render with no task cards", async () => {
      const board = await getBoardByName(page.request, "Design");
      expect(board.columns.map((c) => c.id)).toEqual(["d1", "d2", "d3"]);
      for (const column of board.columns) {
        await expect(boardColumn(page, column.id)).toBeVisible();
        await expect(boardColumn(page, column.id).locator('[data-testid^="task-card-"]')).toHaveCount(0);
      }
    });
  });

  test("BRD2-02: Add card creates a task in the empty column", async ({ page }) => {
    let firstColumnId = "";
    const title = `Design task ${Date.now()}`;
    await test.step("open the Design board", async () => {
      const board = await getBoardByName(page.request, "Design");
      firstColumnId = board.columns[0].id;
      await page.goto(`/board/${board.id}`);
    });
    await test.step("Add card in the first column with a generated title", async () => {
      await page.getByTestId(`add-card-${firstColumnId}`).click();
      await page.getByTestId("task-title-input").fill(title);
      await page.getByTestId("task-create-submit").click();
    });
    await test.step("the new task card appears in that column", async () => {
      const board = await getBoardByName(page.request, "Design");
      const tasks = await getTasks(page.request, board.id);
      const created = tasks.find((t) => t.title === title)!;
      await expect(taskCard(page, created.id)).toContainText(title);
      await expect(boardColumn(page, firstColumnId).locator(`[data-testid=task-card-${created.id}]`)).toBeVisible();
    });
  });
});
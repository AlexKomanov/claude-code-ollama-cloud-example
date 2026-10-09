import { test, expect } from "@playwright/test";
import { resetMocks } from "./helpers";

/**
 * Pure API tests against the Next.js mock API routes (no browser).
 * Runs serially with a pristine store per test (beforeEach/afterEach reset).
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});
test.afterEach(async ({ page }) => {
  await resetMocks(page);
});

test.describe("GET endpoints", () => {
  test("/api/boards returns the board list with ids and columns", async ({ request }) => {
    const res = await request.get("/api/boards");
    expect(res.status()).toBe(200);
    const boards = await res.json();
    expect(Array.isArray(boards)).toBeTruthy();
    for (const board of boards) {
      expect(board.id).toBeTruthy();
      expect(board.name).toBeTruthy();
      expect(Array.isArray(board.columns)).toBeTruthy();
    }
  });

  test("/api/boards/:id returns a single board or 404", async ({ request }) => {
    const boards = await (await request.get("/api/boards")).json();
    const ok = await request.get(`/api/boards/${boards[0].id}`);
    expect(ok.status()).toBe(200);
    expect((await ok.json()).id).toBe(boards[0].id);

    const missing = await request.get("/api/boards/does-not-exist");
    expect(missing.status()).toBe(404);
  });

  test("/api/boards/:id/tasks lists that board's tasks", async ({ request }) => {
    const boards = await (await request.get("/api/boards")).json();
    const withColumns = boards.find((b: { columns: unknown[] }) => b.columns.length > 0);
    const tasks = await (await request.get(`/api/boards/${withColumns.id}/tasks`)).json();
    expect(Array.isArray(tasks)).toBeTruthy();
    for (const task of tasks) {
      expect(task.boardId).toBe(withColumns.id);
    }
  });

  test("/api/users and /api/users/me return users", async ({ request }) => {
    const users = await (await request.get("/api/users")).json();
    expect(users.length).toBeGreaterThan(0);
    const me = await (await request.get("/api/users/me")).json();
    expect(me.id).toBe(users[0].id);
  });
});

test.describe("task mutations", () => {
  test("creating a task persists it against the board", async ({ request }) => {
    const boards = await (await request.get("/api/boards")).json();
    const boardId = boards[0].id;
    const columnId = boards[0].columns[0].id;
    const title = `API task ${Date.now()}`;

    const create = await request.post(`/api/boards/${boardId}/tasks`, {
      data: { columnId, title, priority: "high" },
    });
    expect(create.status()).toBe(201);
    const task = await create.json();
    expect(task.title).toBe(title);
    expect(task.priority).toBe("high");

    const boardTasks = await (await request.get(`/api/boards/${boardId}/tasks`)).json();
    const found = boardTasks.find((t: { id: string }) => t.id === task.id);
    expect(found).toBeTruthy();

    // Clean up so other tests are unaffected.
    await request.delete(`/api/tasks/${task.id}`).catch(() => {});
  });

  test("PATCH /api/tasks/:id updates the task", async ({ request }) => {
    const boards = await (await request.get("/api/boards")).json();
    const tasks = await (await request.get(`/api/boards/${boards[0].id}/tasks`)).json();
    test.skip(tasks.length === 0, "no seeded tasks on this board");

    const patched = await request.patch(`/api/tasks/${tasks[0].id}`, {
      data: { title: `Renamed ${Date.now()}` },
    });
    expect(patched.status()).toBe(200);
    const updated = await patched.json();
    expect(updated.title).toMatch(/^Renamed /);

    const reread = await (await request.get(`/api/tasks/${tasks[0].id}`)).json();
    expect(reread.title).toBe(updated.title);
  });

  test("PATCH /api/tasks/:id/move moves a task to another column", async ({ request }) => {
    const boards = await (await request.get("/api/boards")).json();
    const board = boards.find((b: { columns: unknown[] }) => b.columns.length >= 2);
    test.skip(!board, "no board with >= 2 columns");
    const columnIds: string[] = board.columns.map((c: { id: string }) => c.id);
    const tasks = await (await request.get(`/api/boards/${board.id}/tasks`)).json();
    test.skip(tasks.length === 0, "no seeded tasks on this board");

    const moved = await request.patch(`/api/tasks/${tasks[0].id}/move`, {
      data: { columnId: columnIds[1], order: 0 },
    });
    expect(moved.status()).toBe(200);

    // The task's id lives only in the destination column now.
    const boardAfter = await (await request.get(`/api/boards/${board.id}`)).json();
    for (const column of boardAfter.columns) {
      const hasIt = column.taskIds.includes(tasks[0].id);
      if (column.id === columnIds[1]) expect(hasIt).toBe(true);
      else expect(hasIt).toBe(false);
    }
  });
});

test.describe("board mutations", () => {
  test("POST /api/boards persists and the board is retrievable", async ({ request }) => {
    const name = `API Board ${Date.now()}`;
    const created = await request.post("/api/boards", {
      data: {
        name,
        description: "Created by API test",
        color: "#10b981",
        ownerId: "u1",
        memberIds: ["u1"],
        columns: [
          { id: "col-backlog", name: "Backlog", order: 0, color: "#f3f4f6", taskIds: [] },
        ],
      },
    });
    expect(created.status()).toBe(201);
    const board = await created.json();
    expect(board.columns.every((c: { boardId: string }) => c.boardId === board.id)).toBe(true);

    const fetched = await (await request.get(`/api/boards/${board.id}`)).json();
    expect(fetched.name).toBe(name);

    const removed = await request.delete(`/api/boards/${board.id}`);
    expect(removed.status()).toBe(204);
    expect((await request.get(`/api/boards/${board.id}`)).status()).toBe(404);
  });
});
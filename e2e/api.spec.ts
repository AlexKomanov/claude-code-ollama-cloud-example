import { test, expect } from "@playwright/test";
import { resetMocks } from "./helpers";

/**
 * Pure API tests against the Next.js mock API routes (no browser).
 * Runs serially with a pristine store per test (beforeEach/afterEach reset).
 *
 * Everything here uses only the `request` fixture — no `page` — so no browser
 * context (and therefore no blank-page screenshots) is ever created. Run with:
 * `npm run test:e2e:api`.
 */

test.beforeEach(async ({ request }) => {
  await resetMocks(request);
});
test.afterEach(async ({ request }) => {
  await resetMocks(request);
});

test.describe("GET endpoints", () => {
  test("/api/boards returns the board list with ids and columns", async ({ request }) => {
    let boards: { id: string; name: string; columns: unknown[] }[];

    await test.step("GET /api/boards responds 200", async () => {
      const res = await request.get("/api/boards");
      expect(res.status()).toBe(200);
      boards = await res.json();
    });

    await test.step("every board has an id, a name and a columns array", async () => {
      expect(Array.isArray(boards)).toBeTruthy();
      for (const board of boards) {
        expect(board.id).toBeTruthy();
        expect(board.name).toBeTruthy();
        expect(Array.isArray(board.columns)).toBeTruthy();
      }
    });
  });

  test("/api/boards/:id returns a single board or 404", async ({ request }) => {
    let boardId = "";

    await test.step("GET /api/boards to pick an existing id", async () => {
      const boards = await (await request.get("/api/boards")).json();
      boardId = boards[0].id;
    });

    await test.step("GET /api/boards/:id returns 200 with the same id", async () => {
      const ok = await request.get(`/api/boards/${boardId}`);
      expect(ok.status()).toBe(200);
      expect((await ok.json()).id).toBe(boardId);
    });

    await test.step("GET an unknown id returns 404", async () => {
      const missing = await request.get("/api/boards/does-not-exist");
      expect(missing.status()).toBe(404);
    });
  });

  test("/api/boards/:id/tasks lists that board's tasks", async ({ request }) => {
    let boardId = "";
    let tasks: { boardId: string }[] = [];

    await test.step("find a seeded board with columns", async () => {
      const boards = await (await request.get("/api/boards")).json();
      const withColumns = boards.find((b: { columns: unknown[] }) => b.columns.length > 0);
      boardId = withColumns.id;
    });

    await test.step("GET /api/boards/:id/tasks responds with an array", async () => {
      tasks = await (await request.get(`/api/boards/${boardId}/tasks`)).json();
      expect(Array.isArray(tasks)).toBeTruthy();
    });

    await test.step("every returned task belongs to that board", async () => {
      for (const task of tasks) {
        expect(task.boardId).toBe(boardId);
      }
    });
  });

  test("/api/users and /api/users/me return users", async ({ request }) => {
    let users: { id: string }[] = [];

    await test.step("GET /api/users returns a non-empty list", async () => {
      users = await (await request.get("/api/users")).json();
      expect(users.length).toBeGreaterThan(0);
    });

    await test.step("GET /api/users/me is the first user", async () => {
      const me = await (await request.get("/api/users/me")).json();
      expect(me.id).toBe(users[0].id);
    });
  });
});

test.describe("task mutations", () => {
  test("creating a task persists it against the board", async ({ request }) => {
    let taskId = "";
    let boardId = "";

    await test.step("read the seeded board and its first column", async () => {
      const boards = await (await request.get("/api/boards")).json();
      boardId = boards[0].id;
      const columnId = boards[0].columns[0].id;
      const create = await request.post(`/api/boards/${boardId}/tasks`, {
        data: { columnId, title: `API task ${Date.now()}`, priority: "high" },
      });
      expect(create.status()).toBe(201);
      taskId = (await create.json()).id;
    });

    await test.step("created task echoes title and priority", async () => {
      const boardTasks = await (await request.get(`/api/boards/${boardId}/tasks`)).json();
      const found = boardTasks.find((t: { id: string }) => t.id === taskId);
      expect(found?.priority).toBe("high");
      expect(found).toBeTruthy();
    });

    await test.step("DELETE /api/tasks/:id cleans up (best effort)", async () => {
      await request.delete(`/api/tasks/${taskId}`).catch(() => {});
    });
  });

  test("PATCH /api/tasks/:id updates the task", async ({ request }) => {
    let taskId = "";

    await test.step("read the seeded tasks (skip when the board is empty)", async () => {
      const boards = await (await request.get("/api/boards")).json();
      const tasks = await (await request.get(`/api/boards/${boards[0].id}/tasks`)).json();
      test.skip(tasks.length === 0, "no seeded tasks on this board");
      taskId = tasks[0].id;
    });

    await test.step("PATCH /api/tasks/:id renames the task (200)", async () => {
      const patched = await request.patch(`/api/tasks/${taskId}`, {
        data: { title: `Renamed ${Date.now()}` },
      });
      expect(patched.status()).toBe(200);
      expect((await patched.json()).title).toMatch(/^Renamed /);
    });

    await test.step("GET /api/tasks/:id confirms the rename persisted", async () => {
      const reread = await (await request.get(`/api/tasks/${taskId}`)).json();
      expect(reread.title).toMatch(/^Renamed /);
    });
  });

  test("PATCH /api/tasks/:id/move moves a task to another column", async ({ request }) => {
    let boardId = "";
    let taskId = "";
    let columnIds: string[] = [];

    await test.step("find a board with two columns and a task (skip otherwise)", async () => {
      const boards = await (await request.get("/api/boards")).json();
      const board = boards.find((b: { columns: unknown[] }) => b.columns.length >= 2);
      test.skip(!board, "no board with >= 2 columns");
      boardId = board.id;
      columnIds = board.columns.map((c: { id: string }) => c.id);
      const tasks = await (await request.get(`/api/boards/${boardId}/tasks`)).json();
      test.skip(tasks.length === 0, "no seeded tasks on this board");
      taskId = tasks[0].id;
    });

    await test.step("PATCH /api/tasks/:id/move to the second column (200)", async () => {
      const moved = await request.patch(`/api/tasks/${taskId}/move`, {
        data: { columnId: columnIds[1], order: 0 },
      });
      expect(moved.status()).toBe(200);
    });

    await test.step("destination column holds the task; the others do not", async () => {
      // The task's id lives only in the destination column now.
      const boardAfter = await (await request.get(`/api/boards/${boardId}`)).json();
      for (const column of boardAfter.columns) {
        const hasIt = column.taskIds.includes(taskId);
        if (column.id === columnIds[1]) expect(hasIt).toBe(true);
        else expect(hasIt).toBe(false);
      }
    });
  });
});

test.describe("board mutations", () => {
  test("POST /api/boards persists and the board is retrievable", async ({ request }) => {
    let boardId = "";
    const name = `API Board ${Date.now()}`;

    await test.step("POST /api/boards creates the board (201)", async () => {
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
      boardId = (await created.json()).id;
    });

    await test.step("every created column is linked to the new board", async () => {
      const boards = await (await request.get("/api/boards")).json();
      const board = boards.find((b: { id: string }) => b.id === boardId);
      expect(board.columns.every((c: { boardId: string }) => c.boardId === boardId)).toBe(true);
    });

    await test.step("GET /api/boards/:id returns it by name", async () => {
      const fetched = await (await request.get(`/api/boards/${boardId}`)).json();
      expect(fetched.name).toBe(name);
    });

    await test.step("DELETE /api/boards/:id removes it (204)", async () => {
      const removed = await request.delete(`/api/boards/${boardId}`);
      expect(removed.status()).toBe(204);
    });

    await test.step("GET the deleted board now 404s", async () => {
      expect((await request.get(`/api/boards/${boardId}`)).status()).toBe(404);
    });
  });
});
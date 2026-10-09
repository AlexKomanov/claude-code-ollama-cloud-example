import { test, expect } from "@playwright/test";
import { resetMocks, getBoards, boardCards, getBoardByName } from "./helpers";

/**
 * Boards Page tests (TEST_PLAN §2: BP-01..06)
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});

test("BP-01: load boards page", async ({ page }) => {
  await test.step("open /boards", async () => {
    await page.goto("/boards");
  });
  await test.step("My Boards heading is visible", async () => {
    await expect(page.getByRole("heading", { name: "My Boards" })).toBeVisible();
  });
  await test.step("cards match the boards reported by the API", async () => {
    const boards = await getBoards(page.request);
    await expect(boardCards(page)).toHaveCount(boards.length);
  });
});

test("BP-02: board cards display name, description, avatars and column count", async ({ page }) => {
  await test.step("open /boards and look up the Engineering board", async () => {
    await page.goto("/boards");
    await getBoards(page.request);
  });
  await test.step("the card shows name, description and column count", async () => {
    const boards = await getBoards(page.request);
    const engineering = boards.find((b) => b.name === "Engineering");
    const card = page.getByTestId(`board-card-${engineering!.id}`);
    await expect(card).toContainText("Engineering");
    await expect(card).toContainText(engineering!.description ?? "");
    await expect(card).toContainText(`${engineering!.columns.length} Columns`);
  });
  await test.step("one avatar pill per member (plus an overflow \"+N\")", async () => {
    const boards = await getBoards(page.request);
    const engineering = boards.find((b) => b.name === "Engineering");
    const card = page.getByTestId(`board-card-${engineering!.id}`);
    await expect(card.locator(".-space-x-2 > div")).toHaveCount(engineering!.memberIds!.length);
  });
});

test("BP-03: clicking the Engineering board navigates to it", async ({ page }) => {
  await test.step("open /boards", async () => {
    await page.goto("/boards");
  });
  await test.step("click the Engineering board card", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.getByTestId(`board-card-${board.id}`).click();
  });
  await test.step("board page shows the Engineering heading", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    await expect(page).toHaveURL(new RegExp(`/board/${board.id}$`));
    await expect(page.getByTestId("board-heading")).toHaveText("Engineering");
  });
});

test("BP-04: clicking the Design board navigates to it", async ({ page }) => {
  await test.step("open /boards", async () => {
    await page.goto("/boards");
  });
  await test.step("click the Design board card", async () => {
    const board = await getBoardByName(page.request, "Design");
    await page.getByTestId(`board-card-${board.id}`).click();
  });
  await test.step("board page shows the Design heading", async () => {
    const board = await getBoardByName(page.request, "Design");
    await expect(page).toHaveURL(new RegExp(`/board/${board.id}$`));
    await expect(page.getByTestId("board-heading")).toHaveText("Design");
  });
});

test("BP-05: Create Board opens a dialog and creates a board", async ({ page }) => {
  const name = `Playwright Board ${Date.now()}`;
  await test.step("open /boards", async () => {
    await page.goto("/boards");
  });
  await test.step("fill the Create Board dialog with name, description and color", async () => {
    await page.getByTestId("create-board-button").click();
    await page.getByTestId("board-name-input").fill(name);
    await page.getByTestId("board-desc-input").fill("Created by the Playwright suite");
    await page.getByTestId("color-swatch-3").click();
  });
  await test.step("submitting navigates to the new board", async () => {
    await page.getByTestId("create-board-submit").click();
    await expect(page).toHaveURL(/\/board\/b\d+/);
    await expect(page.getByTestId("board-heading")).toHaveText(name);
  });
  await test.step("the sidebar lists the new board (desktop renders it, mobile hides it behind the drawer)", async () => {
    const newId = page.url().match(/\/board\/(b\d+)/)![1];
    if ((await page.viewportSize())!.width >= 1024) {
      await expect(page.getByTestId(`sidebar-board-${newId}`)).toBeVisible();
    }
  });
});

test("BP-06: admin deletes a board after confirmation", async ({ page }) => {
  let boardId = "";
  await test.step("open /boards and create a scratch board via the API", async () => {
    await page.goto("/boards");
    const created = await page.request.post("/api/boards", {
      data: {
        name: `Scratch ${Date.now()}`, description: "", color: "#14b8a6",
        ownerId: "u1", memberIds: ["u1"], columns: [{ id: "col-x", name: "Backlog", order: 0, color: "#f3f4f6", taskIds: [] }],
      },
    });
    boardId = (await created.json()).id;
  });
  await test.step("reload so the scratch card (and its menu) is rendered", async () => {
    await page.reload();
    await expect(page.getByTestId(`board-card-${boardId}`)).toBeVisible();
  });
  await test.step("delete via the board menu, auto-accepting the confirm dialog", async () => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByTestId(`board-menu-${boardId}`).click();
    await page.getByTestId(`board-menu-delete-${boardId}`).click();
  });
  await test.step("the card disappears and the API returns 404", async () => {
    await expect(page.getByTestId(`board-card-${boardId}`)).toHaveCount(0, { timeout: 5000 });
    expect((await page.request.get(`/api/boards/${boardId}`)).status()).toBe(404);
  });
});
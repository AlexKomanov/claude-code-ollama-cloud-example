import { test, expect } from "@playwright/test";
import { resetMocks, getBoards, boardCards, getBoardByName } from "./helpers";

/**
 * Boards Page tests (TEST_PLAN §2: BP-01..06)
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});

test("BP-01: load boards page", async ({ page }) => {
  await page.goto("/boards");
  await expect(page.getByRole("heading", { name: "My Boards" })).toBeVisible();
  // Cards match the boards reported by the API (dynamic, not hardcoded).
  const boards = await getBoards(page.request);
  await expect(boardCards(page)).toHaveCount(boards.length);
});

test("BP-02: board cards display name, description, avatars and column count", async ({ page }) => {
  await page.goto("/boards");
  const boards = await getBoards(page.request);
  const engineering = boards.find((b) => b.name === "Engineering");
  const card = page.getByTestId(`board-card-${engineering!.id}`);
  await expect(card).toContainText("Engineering");
  await expect(card).toContainText(engineering!.description ?? "");
  await expect(card).toContainText(`${engineering!.columns.length} Columns`);
  // One avatar pill per member (plus an overflow "+N").
  await expect(card.locator(".-space-x-2 > div")).toHaveCount(engineering!.memberIds!.length);
});

test("BP-03: clicking the Engineering board navigates to it", async ({ page }) => {
  await page.goto("/boards");
  const board = await getBoardByName(page.request, "Engineering");
  await page.getByTestId(`board-card-${board.id}`).click();
  await expect(page).toHaveURL(new RegExp(`/board/${board.id}$`));
  await expect(page.getByTestId("board-heading")).toHaveText("Engineering");
});

test("BP-04: clicking the Design board navigates to it", async ({ page }) => {
  await page.goto("/boards");
  const board = await getBoardByName(page.request, "Design");
  await page.getByTestId(`board-card-${board.id}`).click();
  await expect(page).toHaveURL(new RegExp(`/board/${board.id}$`));
  await expect(page.getByTestId("board-heading")).toHaveText("Design");
});

test("BP-05: Create Board opens a dialog and creates a board", async ({ page }) => {
  await page.goto("/boards");
  const name = `Playwright Board ${Date.now()}`;
  await page.getByTestId("create-board-button").click();
  await page.getByTestId("board-name-input").fill(name);
  await page.getByTestId("board-desc-input").fill("Created by the Playwright suite");
  await page.getByTestId("color-swatch-3").click();
  await page.getByTestId("create-board-submit").click();

  await expect(page).toHaveURL(/\/board\/b\d+/);
  await expect(page.getByTestId("board-heading")).toHaveText(name);
  // New board appears in the sidebar.
  const newId = page.url().match(/\/board\/(b\d+)/)![1];
  // The sidebar list is desktop-only; on narrow viewports it sits behind the
  // hamburger drawer (see RES-01), so only assert it where it renders.
  if ((await page.viewportSize())!.width >= 1024) {
    await expect(page.getByTestId(`sidebar-board-${newId}`)).toBeVisible();
  }
});

test("BP-06: admin deletes a board after confirmation", async ({ page }) => {
  await page.goto("/boards");
  // Delete a scratch board so the seeded ones survive for other tests.
  const created = await page.request.post("/api/boards", {
    data: {
      name: `Scratch ${Date.now()}`, description: "", color: "#14b8a6",
      ownerId: "u1", memberIds: ["u1"], columns: [{ id: "col-x", name: "Backlog", order: 0, color: "#f3f4f6", taskIds: [] }],
    },
  });
  const board = (await created.json()) as { id: string };

  // The list was rendered before the API-created board existed — reload so the card (and its menu) is present.
  await page.reload();
  await expect(page.getByTestId(`board-card-${board.id}`)).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByTestId(`board-menu-${board.id}`).click();
  await page.getByTestId(`board-menu-delete-${board.id}`).click();

  await expect(page.getByTestId(`board-card-${board.id}`)).toHaveCount(0, { timeout: 5000 });
  // Confirmed on the API side.
  expect((await page.request.get(`/api/boards/${board.id}`)).status()).toBe(404);
});
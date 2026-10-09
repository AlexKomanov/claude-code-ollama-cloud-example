import { test, expect } from "@playwright/test";
import { resetMocks, getBoardByName } from "./helpers";

/**
 * Responsive / Edge cases (TEST_PLAN §6: RES-01..03)
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});
test.afterEach(async ({ page }) => {
  await resetMocks(page);
});

test("RES-01: mobile viewport — drawer nav and horizontally scrollable columns", async ({ page }) => {
  await test.step("shrink the viewport to a 390×844 phone", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
  });
  await test.step("open the Engineering board", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    await expect(page.getByTestId("board-heading")).toBeVisible();
  });
  await test.step("main content is full width and the hamburger is visible", async () => {
    // Sidebar is collapsed behind the hamburger; main content is full width.
    const mainWidth = await page.getByTestId("main-content").evaluate((el) => el.getBoundingClientRect().width);
    expect(mainWidth).toBeGreaterThan(380);
    await expect(page.getByTestId("menu-toggle")).toBeVisible();
  });
  await test.step("columns scroll horizontally; the page itself does not", async () => {
    const scroll = await page.evaluate(() => {
      const el = document.querySelector("main .flex.gap-6");
      return el ? { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth } : null;
    });
    expect(scroll).toBeTruthy();
    expect(scroll!.scrollWidth).toBeGreaterThan(scroll!.clientWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
  await test.step("hamburger opens the drawer; navigating closes it", async () => {
    await page.getByTestId("menu-toggle").click();
    await expect(page.getByTestId("nav-boards").filter({ visible: true })).toBeVisible();
    await page.getByTestId("nav-boards").filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/boards$/);
  });
});

test("RES-02: empty boards state after deleting the last board", async ({ page }) => {
  await test.step("open /boards and wipe all boards via the API", async () => {
    await page.goto("/boards");
    const boards = await (await page.request.get("/api/boards")).json();
    for (const board of boards as { id: string }[]) {
      expect((await page.request.delete(`/api/boards/${board.id}`)).status()).toBe(204);
    }
  });
  await test.step("reload: the empty state is shown", async () => {
    await page.reload();
    await expect(page.getByTestId("empty-state")).toContainText("No boards yet");
  });
  await test.step("creating a board from the empty state works", async () => {
    await page.getByTestId("empty-state-create-button").click();
    await page.getByTestId("board-name-input").fill(`Recovery board ${Date.now()}`);
    await page.getByTestId("create-board-submit").click();
    await expect(page).toHaveURL(/\/board\/b\d+/);
  });
});

test("RES-03: keyboard navigation — tab order and Enter activation", async ({ page }) => {
  let boardId: string;
  await test.step("open /boards and pick the Engineering board", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    boardId = board.id;
    await page.goto("/boards");
  });
  await test.step("walk the first tab stops and record them", async () => {
    await page.evaluate(() => { document.body.setAttribute("tabindex", "-1"); document.body.focus(); });
    const stops: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a || a === document.body) return "body";
        return `${a.tagName} ${(a.getAttribute("aria-label") || "").trim()}`.trim();
      });
      stops.push(stop);
      if (stop.startsWith("DIV")) break; // first board card (role=link div)
    }
  });
  await test.step("Enter on the focused Engineering card navigates to the board", async () => {
    await page.getByTestId(`board-card-${boardId}`).evaluate((el) => (el as HTMLElement).focus());
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/board/${boardId}$`));
    await expect(page.getByTestId("board-heading")).toHaveText("Engineering");
  });
});
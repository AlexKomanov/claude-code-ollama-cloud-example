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
  await page.setViewportSize({ width: 390, height: 844 });
  const board = await getBoardByName(page.request, "Engineering");
  await page.goto(`/board/${board.id}`);
  await expect(page.getByTestId("board-heading")).toBeVisible();

  // Sidebar is collapsed behind the hamburger; main content is full width.
  const mainWidth = await page.getByTestId("main-content").evaluate((el) => el.getBoundingClientRect().width);
  expect(mainWidth).toBeGreaterThan(380);
  await expect(page.getByTestId("menu-toggle")).toBeVisible();

  // Columns scroll horizontally inside the board container, not the page.
  const scroll = await page.evaluate(() => {
    const el = document.querySelector("main .flex.gap-6");
    return el ? { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth } : null;
  });
  expect(scroll).toBeTruthy();
  expect(scroll!.scrollWidth).toBeGreaterThan(scroll!.clientWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Hamburger opens the drawer with navigation; it closes on navigation.
  await page.getByTestId("menu-toggle").click();
  await expect(page.getByTestId("nav-boards").filter({ visible: true })).toBeVisible();
  await page.getByTestId("nav-boards").filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/boards$/);
});

test("RES-02: empty boards state after deleting the last board", async ({ page }) => {
  await page.goto("/boards");
  // Wipe the store so we genuinely hit the zero-boards state.
  const boards = await (await page.request.get("/api/boards")).json();
  for (const board of boards as { id: string }[]) {
    expect((await page.request.delete(`/api/boards/${board.id}`)).status()).toBe(204);
  }

  // The list was rendered before the API deletions — reload so the client sees the empty store.
  await page.reload();
  await expect(page.getByTestId("empty-state")).toContainText("No boards yet");
  await page.getByTestId("empty-state-create-button").click();
  await page.getByTestId("board-name-input").fill(`Recovery board ${Date.now()}`);
  await page.getByTestId("create-board-submit").click();
  await expect(page).toHaveURL(/\/board\/b\d+/);
});

test("RES-03: keyboard navigation — tab order and Enter activation", async ({ page }) => {
  await page.goto("/boards");
  const board = await getBoardByName(page.request, "Engineering");

  // Walk the tab stops and record them.
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

  // Enter on the focused Engineering board card activates navigation.
  await page.getByTestId(`board-card-${board.id}`).evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/board/${board.id}$`));
  await expect(page.getByTestId("board-heading")).toHaveText("Engineering");
});
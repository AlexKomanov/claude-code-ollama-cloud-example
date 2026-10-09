import { test, expect } from "@playwright/test";
import { resetMocks, getBoardByName, getTasks, taskCard } from "./helpers";

/**
 * Task Modal tests (TEST_PLAN §4: TM-01..08)
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});
test.afterEach(async ({ page }) => {
  await resetMocks(page);
});

/** Opens the first task on the Engineering board in the details view. */
async function openFirstTask(page: Parameters<typeof taskCard>[0], board: Awaited<ReturnType<typeof getBoardByName>>) {
  const tasks = await getTasks(page.request, board.id);
  const task = tasks[0];
  await page.goto(`/board/${board.id}`);
  await taskCard(page, task.id).click();
  await expect(page.getByTestId("task-dialog")).toBeVisible();
  return task;
}

test("TM-01: modal opens with task details", async ({ page }) => {
  const board = await getBoardByName(page.request, "Engineering");
  const task = await openFirstTask(page, board);
  await expect(page.getByTestId("task-dialog")).toContainText(task.title);
  await expect(page.getByTestId("tab-details")).toContainText("Details");
  await expect(page.getByTestId("task-dialog")).toContainText(task.assigneeId ? "John Developer" : "Unassigned");
});

test("TM-02: edit title saves to the card and the API", async ({ page }) => {
  const board = await getBoardByName(page.request, "Engineering");
  const task = await openFirstTask(page, board);
  const newTitle = `Renamed by Playwright ${Date.now()}`;

  await page.getByTestId("task-edit-button").click();
  await page.getByTestId("task-title-input").fill(newTitle);
  await page.getByTestId("task-save-button").click();

  await expect(taskCard(page, task.id)).toContainText(newTitle);
  const reread = await (await page.request.get(`/api/tasks/${task.id}`)).json();
  expect(reread.title).toBe(newTitle);
});

test("TM-03: edit description persists", async ({ page }) => {
  const board = await getBoardByName(page.request, "Engineering");
  const task = await openFirstTask(page, board);
  const newDesc = `Fresh description ${Date.now()}`;

  await page.getByTestId("task-edit-button").click();
  await page.getByTestId("task-description-input").fill(newDesc);
  await page.getByTestId("task-save-button").click();

  // Close the still-open modal, then reopen from the card to verify persistence.
  await page.getByTestId("task-close-button").click();
  await taskCard(page, task.id).click();
  await expect(page.getByTestId("task-dialog")).toContainText(newDesc);
  const reread = await (await page.request.get(`/api/tasks/${task.id}`)).json();
  expect(reread.description).toBe(newDesc);
});

test("TM-04: priority change updates the card badge", async ({ page }) => {
  const board = await getBoardByName(page.request, "Engineering");
  const task = await openFirstTask(page, board);

  await page.getByTestId("task-edit-button").click();
  await page.getByTestId("task-priority-select").selectOption("high");
  await page.getByTestId("task-save-button").click();

  await expect(taskCard(page, task.id).getByTestId(`task-priority-${task.id}`)).toHaveText("high");
});

test("TM-05: assignee change updates the avatar", async ({ page }) => {
  const board = await getBoardByName(page.request, "Engineering");
  const task = await openFirstTask(page, board);
  const users = await (await page.request.get("/api/users")).json();
  const jane = users.find((u: { name: string }) => u.name === "Jane Designer");

  await page.getByTestId("task-edit-button").click();
  await page.getByTestId("task-assignee-select").selectOption(jane.id);
  await page.getByTestId("task-save-button").click();

  const avatar = taskCard(page, task.id).getByTestId(`task-avatar-${task.id}`);
  await expect(avatar).toHaveText(/J[DJ]/); // Jane Designer's initials
  await expect(avatar).toHaveAttribute("title", "Jane Designer");
});

test("TM-06: add checklist item", async ({ page }) => {
  const board = await getBoardByName(page.request, "Engineering");
  await openFirstTask(page, board);

  await page.getByTestId("tab-checklist").click();
  await page.getByTestId("checklist-new-item").fill("Playwright checklist item");
  await page.getByTestId("checklist-new-item").press("Enter");

  await expect(page.getByTestId("task-dialog")).toContainText("Playwright checklist item");
});

test("TM-07: toggle checklist item completion via the API", async ({ page }) => {
  const board = await getBoardByName(page.request, "Engineering");
  const task = await openFirstTask(page, board);

  await page.getByTestId("tab-checklist").click();
  await page.getByTestId("checklist-new-item").fill("Toggle me");
  await page.getByTestId("checklist-new-item").press("Enter");

  const checkbox = page.getByTestId("task-dialog").locator('input[type="checkbox"]').first();
  await checkbox.check();
  await expect(checkbox).toBeChecked();

  const reread = await (await page.request.get(`/api/tasks/${task.id}`)).json();
  const item = (reread.checklist as { content: string; completed: boolean }[]).find((i) => i.content === "Toggle me");
  expect(item?.completed).toBe(true);

  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  const reread2 = await (await page.request.get(`/api/tasks/${task.id}`)).json();
  expect(reread2.checklist.find((i: { content: string }) => i.content === "Toggle me").completed).toBe(false);
});

test("TM-08: closing the modal keeps the changes", async ({ page }) => {
  const board = await getBoardByName(page.request, "Engineering");
  const task = await openFirstTask(page, board);
  const newTitle = `Persisted ${Date.now()}`;

  await page.getByTestId("task-edit-button").click();
  await page.getByTestId("task-title-input").fill(newTitle);
  await page.getByTestId("task-save-button").click();
  await expect(taskCard(page, task.id)).toContainText(newTitle);

  await page.getByTestId("task-close-button").click();
  await expect(page.getByTestId("task-dialog")).toHaveCount(0);

  // Reopen: the change is still there.
  await taskCard(page, task.id).click();
  await expect(page.getByTestId("task-dialog")).toContainText(newTitle);
});
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

test("TM-01: modal opens with task details", async ({ page }) => {
  let board: Awaited<ReturnType<typeof getBoardByName>>;
  let task: { title: string; assigneeId?: string };

  await test.step("open the first Engineering task in the details view", async () => {
    board = await getBoardByName(page.request, "Engineering");
    const tasks = await getTasks(page.request, board.id);
    task = tasks[0];
    await page.goto(`/board/${board.id}`);
    await taskCard(page, task.id).click();
  });
  await test.step("dialog shows the title, a Details tab and the assignee", async () => {
    await expect(page.getByTestId("task-dialog")).toContainText(task.title);
    await expect(page.getByTestId("tab-details")).toContainText("Details");
    await expect(page.getByTestId("task-dialog")).toContainText(task.assigneeId ? "John Developer" : "Unassigned");
  });
});

test("TM-02: edit title saves to the card and the API", async ({ page }) => {
  let taskId = "";
  const newTitle = `Renamed by Playwright ${Date.now()}`;
  await test.step("open the first Engineering task in the details view", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    taskId = (await getTasks(page.request, board.id))[0].id;
    await page.goto(`/board/${board.id}`);
    await taskCard(page, taskId).click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
  });
  await test.step("enter edit mode, rename the title and save", async () => {
    await page.getByTestId("task-edit-button").click();
    await page.getByTestId("task-title-input").fill(newTitle);
    await page.getByTestId("task-save-button").click();
  });
  await test.step("card and API both show the new title", async () => {
    await expect(taskCard(page, taskId)).toContainText(newTitle);
    const reread = await (await page.request.get(`/api/tasks/${taskId}`)).json();
    expect(reread.title).toBe(newTitle);
  });
});

test("TM-03: edit description persists", async ({ page }) => {
  let taskId = "";
  const newDesc = `Fresh description ${Date.now()}`;
  await test.step("open the first Engineering task in the details view", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    taskId = (await getTasks(page.request, board.id))[0].id;
    await page.goto(`/board/${board.id}`);
    await taskCard(page, taskId).click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
  });
  await test.step("enter edit mode, replace the description and save", async () => {
    await page.getByTestId("task-edit-button").click();
    await page.getByTestId("task-description-input").fill(newDesc);
    await page.getByTestId("task-save-button").click();
  });
  await test.step("close the modal and reopen from the card", async () => {
    await page.getByTestId("task-close-button").click();
    await taskCard(page, taskId).click();
  });
  await test.step("dialog and API both show the new description", async () => {
    await expect(page.getByTestId("task-dialog")).toContainText(newDesc);
    const reread = await (await page.request.get(`/api/tasks/${taskId}`)).json();
    expect(reread.description).toBe(newDesc);
  });
});

test("TM-04: priority change updates the card badge", async ({ page }) => {
  let taskId = "";
  await test.step("open the first Engineering task in the details view", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    taskId = (await getTasks(page.request, board.id))[0].id;
    await page.goto(`/board/${board.id}`);
    await taskCard(page, taskId).click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
  });
  await test.step("enter edit mode, set priority to high and save", async () => {
    await page.getByTestId("task-edit-button").click();
    await page.getByTestId("task-priority-select").selectOption("high");
    await page.getByTestId("task-save-button").click();
  });
  await test.step("the card badge shows the new priority", async () => {
    await expect(taskCard(page, taskId).getByTestId(`task-priority-${taskId}`)).toHaveText("high");
  });
});

test("TM-05: assignee change updates the avatar", async ({ page }) => {
  let taskId = "";
  let janeId = "";
  await test.step("open the first Engineering task in the details view", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    taskId = (await getTasks(page.request, board.id))[0].id;
    await page.goto(`/board/${board.id}`);
    await taskCard(page, taskId).click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
  });
  await test.step("look up Jane Designer in /api/users", async () => {
    const users = await (await page.request.get("/api/users")).json();
    janeId = users.find((u: { name: string }) => u.name === "Jane Designer").id;
  });
  await test.step("enter edit mode, assign Jane Designer and save", async () => {
    await page.getByTestId("task-edit-button").click();
    await page.getByTestId("task-assignee-select").selectOption(janeId);
    await page.getByTestId("task-save-button").click();
  });
  await test.step("the card avatar shows Jane's initials and name", async () => {
    const avatar = taskCard(page, taskId).getByTestId(`task-avatar-${taskId}`);
    await expect(avatar).toHaveText(/J[DJ]/); // Jane Designer's initials
    await expect(avatar).toHaveAttribute("title", "Jane Designer");
  });
});

test("TM-06: add checklist item", async ({ page }) => {
  await test.step("open the first Engineering task in the details view", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    await page.goto(`/board/${board.id}`);
    const tasks = await getTasks(page.request, board.id);
    await taskCard(page, tasks[0].id).click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
  });
  await test.step("switch to the Checklist tab", async () => {
    await page.getByTestId("tab-checklist").click();
  });
  await test.step("add a checklist item", async () => {
    await page.getByTestId("checklist-new-item").fill("Playwright checklist item");
    await page.getByTestId("checklist-new-item").press("Enter");
  });
  await test.step("the item is visible in the dialog", async () => {
    await expect(page.getByTestId("task-dialog")).toContainText("Playwright checklist item");
  });
});

test("TM-07: toggle checklist item completion via the API", async ({ page }) => {
  let taskId = "";
  await test.step("open the first Engineering task in the details view", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    taskId = (await getTasks(page.request, board.id))[0].id;
    await page.goto(`/board/${board.id}`);
    await taskCard(page, taskId).click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
  });
  await test.step("add a checklist item \"Toggle me\"", async () => {
    await page.getByTestId("tab-checklist").click();
    await page.getByTestId("checklist-new-item").fill("Toggle me");
    await page.getByTestId("checklist-new-item").press("Enter");
  });
  await test.step("checking it marks completed=true in the API too", async () => {
    const checkbox = page.getByTestId("task-dialog").locator('input[type="checkbox"]').first();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    const reread = await (await page.request.get(`/api/tasks/${taskId}`)).json();
    const item = (reread.checklist as { content: string; completed: boolean }[]).find((i) => i.content === "Toggle me");
    expect(item?.completed).toBe(true);
  });
  await test.step("unchecking it marks completed=false in the API too", async () => {
    const checkbox = page.getByTestId("task-dialog").locator('input[type="checkbox"]').first();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    const reread2 = await (await page.request.get(`/api/tasks/${taskId}`)).json();
    expect(reread2.checklist.find((i: { content: string }) => i.content === "Toggle me").completed).toBe(false);
  });
});

test("TM-08: closing the modal keeps the changes", async ({ page }) => {
  let taskId = "";
  const newTitle = `Persisted ${Date.now()}`;
  await test.step("open the first Engineering task in the details view", async () => {
    const board = await getBoardByName(page.request, "Engineering");
    taskId = (await getTasks(page.request, board.id))[0].id;
    await page.goto(`/board/${board.id}`);
    await taskCard(page, taskId).click();
    await expect(page.getByTestId("task-dialog")).toBeVisible();
  });
  await test.step("rename the title and save", async () => {
    await page.getByTestId("task-edit-button").click();
    await page.getByTestId("task-title-input").fill(newTitle);
    await page.getByTestId("task-save-button").click();
    await expect(taskCard(page, taskId)).toContainText(newTitle);
  });
  await test.step("close the modal", async () => {
    await page.getByTestId("task-close-button").click();
    await expect(page.getByTestId("task-dialog")).toHaveCount(0);
  });
  await test.step("reopen: the rename is still there", async () => {
    await taskCard(page, taskId).click();
    await expect(page.getByTestId("task-dialog")).toContainText(newTitle);
  });
});
import { test, expect } from "@playwright/test";
import { resetMocks } from "./helpers";

/**
 * Landing Page tests (TEST_PLAN §1: LP-01, LP-02)
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});

test("LP-01: load landing page", async ({ page }) => {
  await test.step("open the landing page", async () => {
    await page.goto("/");
  });
  await test.step("hero heading and the Enter Dashboard CTA are visible", async () => {
    await expect(page.getByRole("heading", { name: "Welcome to Ticketing" })).toBeVisible();
    await expect(page.getByTestId("enter-dashboard")).toBeVisible();
  });
});

test("LP-02: click Enter Dashboard navigates to boards", async ({ page }) => {
  await test.step("open the landing page", async () => {
    await page.goto("/");
  });
  await test.step("click the Enter Dashboard CTA", async () => {
    await page.getByTestId("enter-dashboard").click();
  });
  await test.step("lands on /boards", async () => {
    await expect(page).toHaveURL(/\/boards$/);
  });
});
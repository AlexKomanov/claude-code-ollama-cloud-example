import { test, expect } from "@playwright/test";
import { resetMocks } from "./helpers";

/**
 * Landing Page tests (TEST_PLAN §1: LP-01, LP-02)
 */

test.beforeEach(async ({ page }) => {
  await resetMocks(page);
});

test("LP-01: load landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome to Ticketing" })).toBeVisible();
  await expect(page.getByTestId("enter-dashboard")).toBeVisible();
});

test("LP-02: click Enter Dashboard navigates to boards", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("enter-dashboard").click();
  await expect(page).toHaveURL(/\/boards$/);
});
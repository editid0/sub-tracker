import { test, expect } from '@playwright/test'

test("Homepage loads correctly", async ({ page }) => {
    // Navigate to the homepage
    await page.goto("/");

    // Check if the title is correct
    await expect(page).toHaveTitle("Subscription Tracker");

    // Check if the main heading is present
    const mainHeading = page.locator("h1");
    await expect(mainHeading).toHaveText("Subscription Tracker");
});
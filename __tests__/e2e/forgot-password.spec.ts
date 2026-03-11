import { test, expect } from "@playwright/test";

test.describe("Forgot Password Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("opens forgot password dialog", async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page.getByText(/reset your password/i)).toBeVisible();
  });

  test("dialog contains email input", async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
  });

  test("dialog contains description text", async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(
      page.getByText(/enter the email associated with your account/i)
    ).toBeVisible();
  });

  test("pre-fills email from login form", async ({ page }) => {
    await page.locator('input[type="email"]').fill("prefilled@test.com");
    await page.getByText(/forgot password/i).click();

    const forgotInput = page.getByPlaceholder(/you@example.com/i);
    await expect(forgotInput).toHaveValue("prefilled@test.com");
  });

  test("cancel button closes dialog", async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page.getByText(/reset your password/i)).toBeVisible();

    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByText(/reset your password/i)).not.toBeVisible();
  });

  test("shows success on valid email submission", async ({ page }) => {
    // Mock the forgot-password API
    await page.route("**/api/auth/forgot-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "If an account with that email exists, a password reset link has been sent.",
        }),
      });
    });

    await page.getByText(/forgot password/i).click();
    const forgotInput = page.getByPlaceholder(/you@example.com/i);
    await forgotInput.fill("valid@test.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    // Dialog should close and toast should appear
    await expect(page.getByText(/reset your password/i)).not.toBeVisible({ timeout: 5000 });
  });

  test("shows sending state during API call", async ({ page }) => {
    await page.route("**/api/auth/forgot-password", async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Sent" }),
      });
    });

    await page.getByText(/forgot password/i).click();
    await page.getByPlaceholder(/you@example.com/i).fill("test@test.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    await expect(page.getByText(/sending/i)).toBeVisible({ timeout: 2000 });
  });

  test("shows error on API failure", async ({ page }) => {
    await page.route("**/api/auth/forgot-password", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Unable to send password reset email right now.",
        }),
      });
    });

    await page.getByText(/forgot password/i).click();
    await page.getByPlaceholder(/you@example.com/i).fill("test@test.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    await expect(page.getByText(/unable to send/i)).toBeVisible({ timeout: 5000 });
  });
});

import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("page loads with login form visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("email input accepts text", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
  });

  test("password input accepts text", async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill("testpassword");
    await expect(passwordInput).toHaveValue("testpassword");
  });

  test("shows validation error for empty email on blur", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    await emailInput.blur();
    await expect(page.getByText(/email.*not allowed to be empty/i)).toBeVisible();
  });

  test("shows validation error for empty password on blur", async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.focus();
    await passwordInput.blur();
    await expect(page.getByText(/password.*not allowed to be empty/i)).toBeVisible();
  });

  test("forgot password link is visible", async ({ page }) => {
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test("forgot password link opens dialog", async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page.getByText(/reset your password/i)).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
  });

  test("forgot password dialog has cancel button", async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
  });

  test("forgot password dialog has send reset link button", async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });

  test("forgot password cancel closes dialog", async ({ page }) => {
    await page.getByText(/forgot password/i).click();
    await expect(page.getByText(/reset your password/i)).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByText(/reset your password/i)).not.toBeVisible();
  });

  test("login button text changes when loading", async ({ page }) => {
    // Fill in credentials and submit
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').first().fill("password123");

    // Intercept the auth request to create a delay
    await page.route("**/auth/v1/token**", async (route) => {
      // Delay to observe loading state
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login" }),
      });
    });

    await page.getByRole("button", { name: /login/i }).click();

    // Should briefly show "Logging in..."
    await expect(page.getByText(/logging in/i)).toBeVisible({ timeout: 2000 });
  });

  test("shows error on invalid credentials", async ({ page }) => {
    // Mock failed login
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login" }),
      });
    });

    await page.locator('input[type="email"]').fill("bad@test.com");
    await page.locator('input[type="password"]').first().fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();

    // Should show error notification or message
    await expect(
      page.getByText(/invalid email or password/i).or(page.locator('[data-sonner-toast]'))
    ).toBeVisible({ timeout: 5000 });
  });

  test("successful admin login redirects to dashboard", async ({ page }) => {
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-token",
          token_type: "bearer",
          user: {
            id: "admin-123",
            email: "admin@test.com",
            user_metadata: { name: "Admin", role: "admin" },
            app_metadata: { role: "admin", isAdmin: true, status: "approved" },
          },
        }),
      });
    });

    await page.locator('input[type="email"]').fill("admin@test.com");
    await page.locator('input[type="password"]').first().fill("password123");
    await page.getByRole("button", { name: /login/i }).click();

    await page.waitForURL("**/dashboard", { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("successful agent login redirects to agent page", async ({ page }) => {
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-token",
          token_type: "bearer",
          user: {
            id: "agent-456",
            email: "agent@test.com",
            user_metadata: { name: "Agent", role: "agent" },
            app_metadata: { role: "agent", isAdmin: false, status: "approved" },
          },
        }),
      });
    });

    await page.locator('input[type="email"]').fill("agent@test.com");
    await page.locator('input[type="password"]').first().fill("password123");
    await page.getByRole("button", { name: /login/i }).click();

    await page.waitForURL("**/agent", { timeout: 10000 });
    expect(page.url()).toContain("/agent");
  });

  test("pending user login redirects to pending-approval", async ({ page }) => {
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-token",
          token_type: "bearer",
          user: {
            id: "pending-789",
            email: "pending@test.com",
            user_metadata: { name: "Pending" },
            app_metadata: { role: "agent", isAdmin: false, status: "pending" },
          },
        }),
      });
    });

    await page.locator('input[type="email"]').fill("pending@test.com");
    await page.locator('input[type="password"]').first().fill("password123");
    await page.getByRole("button", { name: /login/i }).click();

    await page.waitForURL("**/pending-approval**", { timeout: 10000 });
    expect(page.url()).toContain("/pending-approval");
  });

  test("home page also shows login form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
  });
});

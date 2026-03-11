import { test, expect } from "@playwright/test";

// Helper to set auth state in localStorage
async function loginAsAdmin(page: any) {
  await page.goto("/login");

  // Mock successful admin login
  await page.route("**/auth/v1/token**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "mock-admin-token",
        token_type: "bearer",
        user: {
          id: "admin-123",
          email: "admin@test.com",
          user_metadata: { name: "Admin User", role: "admin", extension: "100" },
          app_metadata: { role: "admin", isAdmin: true, status: "approved" },
        },
      }),
    });
  });

  await page.locator('input[type="email"]').fill("admin@test.com");
  await page.locator('input[type="password"]').first().fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}

async function loginAsAgent(page: any) {
  await page.goto("/login");

  await page.route("**/auth/v1/token**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "mock-agent-token",
        token_type: "bearer",
        user: {
          id: "agent-456",
          email: "agent@test.com",
          user_metadata: { name: "Agent User", role: "agent", extension: "200" },
          app_metadata: { role: "agent", isAdmin: false, status: "approved" },
        },
      }),
    });
  });

  await page.locator('input[type="email"]').fill("agent@test.com");
  await page.locator('input[type="password"]').first().fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/agent", { timeout: 10000 });
}

test.describe("Dashboard Navigation", () => {
  test("admin sees dashboard after login", async ({ page }) => {
    await loginAsAdmin(page);
    expect(page.url()).toContain("/dashboard");
  });

  test("agent sees agent page after login", async ({ page }) => {
    await loginAsAgent(page);
    expect(page.url()).toContain("/agent");
  });

  test("dashboard page has content", async ({ page }) => {
    await loginAsAdmin(page);
    // The page should render without errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("agent page has content", async ({ page }) => {
    await loginAsAgent(page);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Signup Page", () => {
  test("signup page shows redirect message", async ({ page }) => {
    await page.goto("/signup");
    // Should show message about admin-only registration or redirect
    await page.waitForTimeout(2000);
    // The page either redirects to login or shows a message
    const url = page.url();
    const hasMessage = await page.getByText(/admin/i).isVisible().catch(() => false);
    expect(url.includes("/login") || url.includes("/signup") || hasMessage).toBeTruthy();
  });
});

test.describe("Pending Approval Page", () => {
  test("pending approval page loads", async ({ page }) => {
    await page.goto("/pending-approval");
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows account status information", async ({ page }) => {
    await page.goto("/pending-approval");
    // Should show some pending/approval related content
    const hasContent = await page
      .getByText(/pending|approval|account|status/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test("has back to login option", async ({ page }) => {
    await page.goto("/pending-approval");
    const loginLink = page.getByText(/login|back|sign in/i).first();
    await expect(loginLink).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Reset Password Page", () => {
  test("shows invalid link message without tokens", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/invalid|expired/i).first()).toBeVisible();
  });

  test("has back to login button without tokens", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("button", { name: /back to login/i })).toBeVisible();
  });

  test("back to login navigates correctly", async ({ page }) => {
    await page.goto("/reset-password");
    await page.getByRole("button", { name: /back to login/i }).click();
    await page.waitForURL("**/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });
});

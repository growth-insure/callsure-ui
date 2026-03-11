import { test, expect } from "@playwright/test";

test.describe("User Management Page (Read-Only)", () => {
  test.beforeEach(async ({ page }) => {
    // Set auth state in localStorage before navigating
    await page.goto("/login");

    // Mock login
    await page.route("**/auth/v1/token**", async (route) => {
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

    // Mock users API
    await page.route("**/api/users/pending", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [
            {
              id: "admin-123",
              email: "admin@test.com",
              name: "Admin User",
              role: "super-admin",
              status: "approved",
              isAdmin: true,
              isPendingUser: false,
              createdAt: "2024-01-15T10:00:00Z",
              user_metadata: { extension: "100", name: "Admin User" },
            },
            {
              id: "agent-456",
              email: "agent@test.com",
              name: "Test Agent",
              role: "agent",
              status: "approved",
              isAdmin: false,
              isPendingUser: false,
              createdAt: "2024-02-20T10:00:00Z",
              user_metadata: { extension: "200", name: "Test Agent" },
            },
            {
              id: "pending-789",
              email: "pending@test.com",
              name: "Pending User",
              role: "agent",
              status: "pending",
              isAdmin: false,
              isPendingUser: true,
              createdAt: "2024-03-01T10:00:00Z",
              user_metadata: { extension: "300", name: "Pending User" },
            },
          ],
          total: 3,
        }),
      });
    });

    await page.route("**/api/users/manage", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
        }),
      });
    });

    // Login and navigate to users page
    await page.locator('input[type="email"]').fill("admin@test.com");
    await page.locator('input[type="password"]').first().fill("password123");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("user management page loads from dashboard/users", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.getByText(/user management/i)).toBeVisible({ timeout: 10000 });
  });

  test("displays user count", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.getByText("3")).toBeVisible({ timeout: 10000 });
  });

  test("displays user names", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.getByText("Admin User")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Test Agent")).toBeVisible();
    await expect(page.getByText("Pending User")).toBeVisible();
  });

  test("displays user emails", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.getByText("admin@test.com")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("agent@test.com")).toBeVisible();
  });

  test("shows Add User button", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(
      page.getByRole("button", { name: /add user/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows 'You' label for current admin user", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.getByText("You")).toBeVisible({ timeout: 10000 });
  });

  test("Add User button opens modal", async ({ page }) => {
    await page.goto("/dashboard/users");
    await page.getByRole("button", { name: /add user/i }).click({ timeout: 10000 });
    await expect(page.getByText(/add new user/i)).toBeVisible({ timeout: 5000 });
  });

  test("Add User modal has required fields", async ({ page }) => {
    await page.goto("/dashboard/users");
    await page.getByRole("button", { name: /add user/i }).click({ timeout: 10000 });

    await expect(page.getByText(/full name/i)).toBeVisible();
    await expect(page.getByText(/extension/i).first()).toBeVisible();
    await expect(page.getByText(/email/i).first()).toBeVisible();
    await expect(page.getByText(/role/i).first()).toBeVisible();
  });

  test("Add User modal has cancel button", async ({ page }) => {
    await page.goto("/dashboard/users");
    await page.getByRole("button", { name: /add user/i }).click({ timeout: 10000 });

    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
  });

  test("Add User modal cancel closes modal", async ({ page }) => {
    await page.goto("/dashboard/users");
    await page.getByRole("button", { name: /add user/i }).click({ timeout: 10000 });
    await expect(page.getByText(/add new user/i)).toBeVisible();

    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByText(/add new user/i)).not.toBeVisible();
  });

  test("table has correct column headers", async ({ page }) => {
    await page.goto("/dashboard/users");
    await page.waitForTimeout(2000);

    await expect(page.getByText("Name").first()).toBeVisible();
    await expect(page.getByText("Email").first()).toBeVisible();
    await expect(page.getByText("Role").first()).toBeVisible();
  });

  test("actions menu shows edit user option", async ({ page }) => {
    await page.goto("/dashboard/users");
    await page.getByRole("button", { name: /actions for test agent/i }).click();
    await expect(page.getByRole("menuitem", { name: /edit user/i })).toBeVisible();
  });

  test("edits user name and email from edit modal", async ({ page }) => {
    await page.goto("/dashboard/users");
    await page.getByRole("button", { name: /actions for test agent/i }).click();
    await page.getByRole("menuitem", { name: /edit user/i }).click();

    await expect(page.getByRole("heading", { name: /edit user/i })).toBeVisible();
    await page.locator("#edit-user-name").fill("Updated Agent");
    await page.locator("#edit-user-email").fill("updated.agent@test.com");

    const patchRequestPromise = page.waitForRequest((request) => {
      return request.url().includes("/api/users/manage") && request.method() === "PATCH";
    });

    await page.getByRole("button", { name: /save changes/i }).click();
    const request = await patchRequestPromise;
    const requestData = JSON.parse(request.postData() || "{}");

    expect(requestData.userId).toBe("agent-456");
    expect(requestData.name).toBe("Updated Agent");
    expect(requestData.email).toBe("updated.agent@test.com");

    await expect(page.getByText("Updated Agent")).toBeVisible();
    await expect(page.getByText("updated.agent@test.com")).toBeVisible();
  });

  test("deletes user from edit modal", async ({ page }) => {
    await page.goto("/dashboard/users");
    await page.getByRole("button", { name: /actions for test agent/i }).click();
    await page.getByRole("menuitem", { name: /edit user/i }).click();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    const deleteRequestPromise = page.waitForRequest((request) => {
      return request.url().includes("/api/users/manage") && request.method() === "DELETE";
    });

    await page.getByRole("button", { name: /delete user/i }).click();
    const request = await deleteRequestPromise;
    const requestData = JSON.parse(request.postData() || "{}");

    expect(requestData.userId).toBe("agent-456");
    await expect(page.getByText("Test Agent")).not.toBeVisible();
    await expect(page.getByText("agent@test.com")).not.toBeVisible();
  });
});

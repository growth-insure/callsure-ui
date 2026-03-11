import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock email service
vi.mock("@/lib/emailService", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

const { POST } = await import("@/app/api/users/create/route");
const { sendWelcomeEmail } = await import("@/lib/emailService");

function createRequest(body: object, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;

  return new NextRequest("http://localhost:3000/api/users/create", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/users/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 401 without authorization header", async () => {
    const request = createRequest({ email: "test@test.com", name: "Test", extension: "100" });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Authorization");
  });

  it("returns 400 when email is missing", async () => {
    const request = createRequest(
      { name: "Test", extension: "100" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("required");
  });

  it("returns 400 when name is missing", async () => {
    const request = createRequest(
      { email: "test@test.com", extension: "100" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when extension is missing", async () => {
    const request = createRequest(
      { email: "test@test.com", name: "Test" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid role", async () => {
    const request = createRequest(
      { email: "test@test.com", name: "Test", extension: "100", role: "superuser" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid role");
  });

  it("returns 400 for non-numeric extension", async () => {
    const request = createRequest(
      { email: "test@test.com", name: "Test", extension: "abc" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("valid number");
  });

  it("returns 400 for extension with special characters", async () => {
    const request = createRequest(
      { email: "test@test.com", name: "Test", extension: "10-1" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 500 when Supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const request = createRequest(
      { email: "test@test.com", name: "Test", extension: "100" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("creates user successfully with correct response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-user-id", email: "test@test.com" }),
    });

    const request = createRequest(
      { email: "test@test.com", name: "Test User", extension: "1001", role: "agent" },
      "Bearer admin-123"
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.id).toBe("new-user-id");
    expect(data.user.email).toBe("test@test.com");
    expect(data.user.name).toBe("Test User");
    expect(data.user.extension).toBe("1001");
    expect(data.user.role).toBe("agent");
  });

  it("defaults role to agent when not specified", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-user-id", email: "test@test.com" }),
    });

    const request = createRequest(
      { email: "test@test.com", name: "Test User", extension: "1001" },
      "Bearer admin-123"
    );
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.role).toBe("agent");
  });

  it("accepts admin role", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-admin-id", email: "admin@test.com" }),
    });

    const request = createRequest(
      { email: "admin@test.com", name: "Admin User", extension: "1001", role: "admin" },
      "Bearer admin-123"
    );
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.role).toBe("admin");
  });

  it("calls Supabase admin create user endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-user-id", email: "test@test.com" }),
    });

    const request = createRequest(
      { email: "test@test.com", name: "Test", extension: "100" },
      "Bearer admin-123"
    );
    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/v1/admin/users"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sets email_confirm to true for admin-created users", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-user-id", email: "test@test.com" }),
    });

    const request = createRequest(
      { email: "test@test.com", name: "Test", extension: "100" },
      "Bearer admin-123"
    );
    await POST(request);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.email_confirm).toBe(true);
  });

  it("sends createdBy in app_metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-user-id", email: "test@test.com" }),
    });

    const request = createRequest(
      { email: "test@test.com", name: "Test", extension: "100" },
      "Bearer admin-123"
    );
    await POST(request);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.app_metadata.createdBy).toBe("admin-123");
  });

  it("calls sendWelcomeEmail with correct data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-user-id", email: "test@test.com" }),
    });

    const request = createRequest(
      { email: "test@test.com", name: "Test User", extension: "1001", role: "agent" },
      "Bearer admin-123"
    );
    await POST(request);

    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@test.com",
        name: "Test User",
        role: "agent",
        extension: "1001",
      })
    );
  });

  it("succeeds even when email sending fails", async () => {
    (sendWelcomeEmail as any).mockResolvedValueOnce(false);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-user-id", email: "test@test.com" }),
    });

    const request = createRequest(
      { email: "test@test.com", name: "Test User", extension: "1001" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("returns 500 on Supabase create user failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      text: () => Promise.resolve("User already exists"),
    });

    const request = createRequest(
      { email: "test@test.com", name: "Test User", extension: "1001" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("returns 500 on unexpected error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = createRequest(
      { email: "test@test.com", name: "Test User", extension: "1001" },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("Internal server error");
  });
});

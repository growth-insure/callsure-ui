import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const { POST } = await import("@/app/api/users/promote-admin/route");

function createRequest(body: object, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;

  return new NextRequest("http://localhost:3000/api/users/promote-admin", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/users/promote-admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 401 without authorization header", async () => {
    const request = createRequest({ userId: "user-123", isAdmin: true });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Authorization");
  });

  it("returns 403 for self-modification attempt", async () => {
    const request = createRequest(
      { userId: "admin-123", isAdmin: true },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("own account");
  });

  it("returns 500 when Supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const request = createRequest(
      { userId: "user-456", isAdmin: true },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("returns success on promote to admin", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-456" }),
    });

    const request = createRequest(
      { userId: "user-456", isAdmin: true },
      "Bearer admin-123"
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("promoted to admin");
    expect(data.isAdmin).toBe(true);
  });

  it("returns success on demote from admin", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-456" }),
    });

    const request = createRequest(
      { userId: "user-456", isAdmin: false },
      "Bearer admin-123"
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("demoted from admin");
    expect(data.isAdmin).toBe(false);
  });

  it("sets role to super-admin on promote", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-456" }),
    });

    const request = createRequest(
      { userId: "user-456", isAdmin: true },
      "Bearer admin-123"
    );
    await POST(request);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.app_metadata.role).toBe("super-admin");
    expect(calledBody.app_metadata.isAdmin).toBe(true);
  });

  it("sets role to agent on demote", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-456" }),
    });

    const request = createRequest(
      { userId: "user-456", isAdmin: false },
      "Bearer admin-123"
    );
    await POST(request);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.app_metadata.role).toBe("agent");
    expect(calledBody.app_metadata.isAdmin).toBe(false);
  });

  it("updates user_metadata role as well", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-456" }),
    });

    const request = createRequest(
      { userId: "user-456", isAdmin: true },
      "Bearer admin-123"
    );
    await POST(request);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.user_metadata.role).toBe("super-admin");
  });

  it("calls Supabase PUT endpoint with correct userId", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-456" }),
    });

    const request = createRequest(
      { userId: "user-456", isAdmin: true },
      "Bearer admin-123"
    );
    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/v1/admin/users/user-456"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("includes timestamp in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-456" }),
    });

    const request = createRequest(
      { userId: "user-456", isAdmin: true },
      "Bearer admin-123"
    );
    const response = await POST(request);
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
  });

  it("returns 500 on Supabase API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve("Internal error"),
    });

    const request = createRequest(
      { userId: "user-456", isAdmin: true },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("returns 500 on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = createRequest(
      { userId: "user-456", isAdmin: true },
      "Bearer admin-123"
    );
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});

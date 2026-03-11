import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Dynamic import to ensure env vars are set before module loads
const { POST } = await import("@/app/api/auth/validate/route");

function createRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when userId is missing", async () => {
    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("User ID required");
  });

  it("returns 500 when Supabase URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Supabase configuration missing");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
  });

  it("returns 500 when service role key is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "");
    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 401 when user not found in Supabase", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const request = createRequest({ userId: "nonexistent" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid token or user not found");
  });

  it("returns valid user data on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "admin@test.com",
          app_metadata: { role: "admin", isAdmin: true, status: "approved" },
          user_metadata: { name: "Admin" },
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.user.id).toBe("user-123");
    expect(data.user.email).toBe("admin@test.com");
  });

  it("returns correct status from app_metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: { status: "approved", role: "agent" },
          user_metadata: {},
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.status).toBe("approved");
  });

  it("falls back to user_metadata for status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: {},
          user_metadata: { status: "pending" },
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.status).toBe("pending");
  });

  it("defaults status to pending when no metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: {},
          user_metadata: {},
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.status).toBe("pending");
  });

  it("returns correct role from app_metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: { role: "super-admin" },
          user_metadata: {},
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.role).toBe("super-admin");
  });

  it("falls back to user_metadata for role", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: {},
          user_metadata: { role: "agent" },
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.role).toBe("agent");
  });

  it("defaults role to agent when no metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: {},
          user_metadata: {},
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.role).toBe("agent");
  });

  it("returns isAdmin from app_metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: { isAdmin: true },
          user_metadata: {},
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.isAdmin).toBe(true);
  });

  it("defaults isAdmin to false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: {},
          user_metadata: {},
        }),
    });

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);
    const data = await response.json();

    expect(data.user.isAdmin).toBe(false);
  });

  it("returns 500 on unexpected error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Unexpected error"));

    const request = createRequest({ userId: "user-123" });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("calls Supabase admin API with correct URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "user-123",
          email: "test@test.com",
          app_metadata: {},
          user_metadata: {},
        }),
    });

    const request = createRequest({ userId: "user-123" });
    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/v1/admin/users/user-123"),
      expect.objectContaining({ method: "GET" })
    );
  });
});

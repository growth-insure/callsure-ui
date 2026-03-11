import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const { GET } = await import("@/app/api/users/pending/route");

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;

  return new NextRequest("http://localhost:3000/api/users/pending", {
    method: "GET",
    headers,
  });
}

const mockSupabaseUsers = {
  users: [
    {
      id: "user-1",
      email: "admin@test.com",
      created_at: "2024-01-01T00:00:00Z",
      raw_app_meta_data: { role: "admin", isAdmin: true, status: "approved" },
      app_metadata: { role: "admin", isAdmin: true, status: "approved" },
      user_metadata: { name: "Admin User", extension: "100" },
    },
    {
      id: "user-2",
      email: "agent@test.com",
      created_at: "2024-02-01T00:00:00Z",
      raw_app_meta_data: { role: "agent", isAdmin: false, status: "approved" },
      app_metadata: { role: "agent", isAdmin: false, status: "approved" },
      user_metadata: { name: "Agent User", extension: "200" },
    },
    {
      id: "user-3",
      email: "pending@test.com",
      created_at: "2024-03-01T00:00:00Z",
      raw_app_meta_data: { role: "agent", isAdmin: false, status: "pending" },
      app_metadata: { role: "agent", isAdmin: false, status: "pending" },
      user_metadata: { name: "Pending User" },
    },
    {
      id: "user-4",
      email: "noname@test.com",
      created_at: "2024-04-01T00:00:00Z",
      raw_app_meta_data: {},
      app_metadata: {},
      user_metadata: {},
    },
  ],
};

describe("GET /api/users/pending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 401 without authorization header", async () => {
    const request = createRequest();
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Authorization");
  });

  it("returns 500 when Supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it("returns processed users with metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSupabaseUsers),
    });

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(4);
    expect(data.total).toBe(4);
  });

  it("maps admin user correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSupabaseUsers),
    });

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);
    const data = await response.json();

    const adminUser = data.users.find((u: any) => u.id === "user-1");
    expect(adminUser.role).toBe("admin");
    expect(adminUser.isAdmin).toBe(true);
    expect(adminUser.name).toBe("Admin User");
  });

  it("sets isPendingUser correctly for pending agents", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSupabaseUsers),
    });

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);
    const data = await response.json();

    const pendingUser = data.users.find((u: any) => u.id === "user-3");
    expect(pendingUser.isPendingUser).toBe(true);
    expect(pendingUser.status).toBe("pending");
  });

  it("does not set isPendingUser for admins", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSupabaseUsers),
    });

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);
    const data = await response.json();

    const adminUser = data.users.find((u: any) => u.id === "user-1");
    expect(adminUser.isPendingUser).toBe(false);
  });

  it("falls back to email prefix for missing name", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSupabaseUsers),
    });

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);
    const data = await response.json();

    const noNameUser = data.users.find((u: any) => u.id === "user-4");
    expect(noNameUser.name).toBe("noname");
  });

  it("includes raw metadata in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSupabaseUsers),
    });

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);
    const data = await response.json();

    expect(data.users[0]).toHaveProperty("raw_app_meta_data");
    expect(data.users[0]).toHaveProperty("app_metadata");
    expect(data.users[0]).toHaveProperty("user_metadata");
  });

  it("returns 500 on Supabase API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve("Server error"),
    });

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it("returns 500 on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("Network error");
  });

  it("handles empty users array from Supabase", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ users: [] }),
    });

    const request = createRequest("Bearer admin-123");
    const response = await GET(request);
    const data = await response.json();

    expect(data.users).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it("calls Supabase admin users endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ users: [] }),
    });

    const request = createRequest("Bearer admin-123");
    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/v1/admin/users"),
      expect.objectContaining({ method: "GET" })
    );
  });
});

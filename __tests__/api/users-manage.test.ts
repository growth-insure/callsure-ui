import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const { PATCH, DELETE } = await import("@/app/api/users/manage/route");

function createRequest(
  method: "PATCH" | "DELETE",
  body: object,
  authHeader?: string
): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers.Authorization = authHeader;

  return new NextRequest("http://localhost:3000/api/users/manage", {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/users/manage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 401 without authorization header", async () => {
    const request = createRequest("PATCH", { userId: "user-1", name: "A" });
    const response = await PATCH(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when userId is missing", async () => {
    const request = createRequest("PATCH", { name: "A" }, "Bearer admin-123");
    const response = await PATCH(request);

    expect(response.status).toBe(400);
  });

  it("returns 403 for self-modification attempt", async () => {
    const request = createRequest(
      "PATCH",
      { userId: "admin-123", name: "New Name" },
      "Bearer admin-123"
    );
    const response = await PATCH(request);

    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid email", async () => {
    const request = createRequest(
      "PATCH",
      { userId: "user-1", email: "invalid-email" },
      "Bearer admin-123"
    );
    const response = await PATCH(request);

    expect(response.status).toBe(400);
  });

  it("updates email and metadata name via Supabase admin endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-1" }),
    });

    const request = createRequest(
      "PATCH",
      {
        userId: "user-1",
        name: "Updated User",
        email: "updated@test.com",
        user_metadata: { extension: "200" },
      },
      "Bearer admin-123"
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/v1/admin/users/user-1"),
      expect.objectContaining({ method: "PUT" })
    );

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.email).toBe("updated@test.com");
    expect(calledBody.user_metadata.name).toBe("Updated User");
    expect(calledBody.user_metadata.extension).toBe("200");
  });

  it("returns 500 on Supabase API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve("Internal error"),
    });

    const request = createRequest(
      "PATCH",
      { userId: "user-1", name: "Updated User" },
      "Bearer admin-123"
    );
    const response = await PATCH(request);

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/users/manage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 401 without authorization header", async () => {
    const request = createRequest("DELETE", { userId: "user-1" });
    const response = await DELETE(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when userId is missing", async () => {
    const request = createRequest("DELETE", {}, "Bearer admin-123");
    const response = await DELETE(request);

    expect(response.status).toBe(400);
  });

  it("returns 403 for self-delete attempt", async () => {
    const request = createRequest("DELETE", { userId: "admin-123" }, "Bearer admin-123");
    const response = await DELETE(request);

    expect(response.status).toBe(403);
  });

  it("deletes user via Supabase admin endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(""),
    });

    const request = createRequest("DELETE", { userId: "user-1" }, "Bearer admin-123");
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/v1/admin/users/user-1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("returns 500 on Supabase API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve("Internal error"),
    });

    const request = createRequest("DELETE", { userId: "user-1" }, "Bearer admin-123");
    const response = await DELETE(request);

    expect(response.status).toBe(500);
  });
});

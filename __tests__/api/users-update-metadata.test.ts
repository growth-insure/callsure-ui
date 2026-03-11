import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const { POST } = await import("@/app/api/users/update-metadata/route");

function createRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/users/update-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/users/update-metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 400 when userId is missing", async () => {
    const request = createRequest({
      app_metadata: { role: "agent" },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("User ID required");
  });

  it("returns 500 when Supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const request = createRequest({
      userId: "user-123",
      app_metadata: { role: "agent" },
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("returns success on metadata update", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-123" }),
    });

    const request = createRequest({
      userId: "user-123",
      app_metadata: { role: "agent", status: "approved" },
      user_metadata: { name: "Updated Name" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("updated successfully");
  });

  it("sends both app_metadata and user_metadata to Supabase", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-123" }),
    });

    const appMeta = { role: "agent", status: "approved", isAdmin: false };
    const userMeta = { name: "Test User", extension: "100" };

    const request = createRequest({
      userId: "user-123",
      app_metadata: appMeta,
      user_metadata: userMeta,
    });
    await POST(request);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.app_metadata).toEqual(appMeta);
    expect(calledBody.user_metadata).toEqual(userMeta);
  });

  it("calls correct Supabase endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-123" }),
    });

    const request = createRequest({
      userId: "user-123",
      app_metadata: {},
      user_metadata: {},
    });
    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/v1/admin/users/user-123"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("includes service role key in headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-123" }),
    });

    const request = createRequest({
      userId: "user-123",
      app_metadata: {},
    });
    await POST(request);

    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders.Authorization).toContain("mock-service-role-key");
    expect(calledHeaders.apikey).toBe("mock-service-role-key");
  });

  it("includes timestamp in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-123" }),
    });

    const request = createRequest({
      userId: "user-123",
      app_metadata: {},
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
  });

  it("returns userId in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "user-123" }),
    });

    const request = createRequest({
      userId: "user-123",
      app_metadata: {},
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.userId).toBe("user-123");
  });

  it("returns 500 on Supabase API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: () => Promise.resolve("Internal error"),
    });

    const request = createRequest({
      userId: "user-123",
      app_metadata: { role: "agent" },
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("returns 500 on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = createRequest({
      userId: "user-123",
      app_metadata: { role: "agent" },
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});

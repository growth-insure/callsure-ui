import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const { GET } = await import("@/app/api/action-items/bulk/route");

function createRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/action-items/bulk");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: "GET" });
}

describe("GET /api/action-items/bulk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 400 when extension is missing", async () => {
    const request = createRequest({
      call_date_start: "2024-01-01",
      call_date_end: "2024-01-31",
    });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.missing).toContain("extension");
  });

  it("returns 400 when call_date_start is missing", async () => {
    const request = createRequest({
      extension: "100",
      call_date_end: "2024-01-31",
    });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.missing).toContain("call_date_start");
  });

  it("returns 400 when call_date_end is missing", async () => {
    const request = createRequest({
      extension: "100",
      call_date_start: "2024-01-01",
    });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.missing).toContain("call_date_end");
  });

  it("returns 400 when all params are missing", async () => {
    const request = createRequest({});
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.missing).toHaveLength(3);
    expect(data.error).toBe("Missing required parameters");
  });

  it("includes provided params in error response", async () => {
    const request = createRequest({ extension: "100" });
    const response = await GET(request);
    const data = await response.json();

    expect(data.provided.extension).toBe("100");
    expect(data.provided.call_date_start).toBeNull();
    expect(data.provided.call_date_end).toBeNull();
  });

  it("returns 500 when Supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const request = createRequest({
      extension: "100",
      call_date_start: "2024-01-01",
      call_date_end: "2024-01-31",
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it("returns data array with count", async () => {
    const mockData = [
      { id: "1", audio_file_id: "f1", extension: "100", call_date: "2024-01-15", todo_items: [] },
      { id: "2", audio_file_id: "f2", extension: "100", call_date: "2024-01-20", todo_items: [] },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const request = createRequest({
      extension: "100",
      call_date_start: "2024-01-01",
      call_date_end: "2024-01-31",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.count).toBe(2);
  });

  it("returns empty array when no records", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const request = createRequest({
      extension: "100",
      call_date_start: "2024-01-01",
      call_date_end: "2024-01-31",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(0);
    expect(data.count).toBe(0);
  });

  it("constructs correct Supabase query URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const request = createRequest({
      extension: "100",
      call_date_start: "2024-01-01",
      call_date_end: "2024-01-31",
    });
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("extension=eq.100");
    expect(calledUrl).toContain("call_date=gte.2024-01-01");
    expect(calledUrl).toContain("call_date=lte.2024-01-31");
  });

  it("returns 500 on Supabase failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Server error"),
    });

    const request = createRequest({
      extension: "100",
      call_date_start: "2024-01-01",
      call_date_end: "2024-01-31",
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it("handles column error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("column call_date does not exist"),
    });

    const request = createRequest({
      extension: "100",
      call_date_start: "2024-01-01",
      call_date_end: "2024-01-31",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(data.error).toContain("column");
  });

  it("returns 500 on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = createRequest({
      extension: "100",
      call_date_start: "2024-01-01",
      call_date_end: "2024-01-31",
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("Internal server error");
  });
});

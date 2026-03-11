import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const { POST, GET } = await import("@/app/api/action-items/route");

function createPostRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/action-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createGetRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/action-items");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: "GET" });
}

describe("POST /api/action-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 400 when audio_file_id is missing", async () => {
    const request = createPostRequest({
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when extension is missing", async () => {
    const request = createPostRequest({
      audio_file_id: "file-123",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when date is missing", async () => {
    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when todoItems is missing", async () => {
    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("required");
  });

  it("returns 500 when Supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("creates new record when none exists", async () => {
    // Check returns empty array (no existing record)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    // Insert returns new record
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "record-1",
            audio_file_id: "file-123",
            extension: "100",
            call_date: "2024-01-01",
            todo_items: [{ text: "Follow up" }],
          },
        ]),
    });

    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("created");
  });

  it("updates existing record when one exists", async () => {
    // Check returns existing record
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: "existing-id" }]),
    });
    // Update returns updated record
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "existing-id",
            todo_items: [{ text: "Updated task" }],
          },
        ]),
    });

    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Updated task" }],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("updated");
  });

  it("uses PATCH method for update", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: "existing-id" }]),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: "existing-id" }]),
    });

    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "task" }],
    });
    await POST(request);

    expect(mockFetch.mock.calls[1][1].method).toBe("PATCH");
  });

  it("returns error on check failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad request"),
    });

    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns column error details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("column extension does not exist"),
    });

    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.error).toContain("column");
  });

  it("returns 500 on insert failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Insert failed"),
    });

    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("returns 500 on update failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: "existing-id" }]),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Update failed"),
    });

    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it("returns 500 on unexpected error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = createPostRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
      todoItems: [{ text: "Follow up" }],
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("Internal server error");
  });
});

describe("GET /api/action-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("returns 400 when audio_file_id is missing", async () => {
    const request = createGetRequest({ extension: "100", date: "2024-01-01" });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.missing).toContain("audio_file_id");
  });

  it("returns 400 when extension is missing", async () => {
    const request = createGetRequest({ audio_file_id: "file-123", date: "2024-01-01" });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.missing).toContain("extension");
  });

  it("returns 400 when date is missing", async () => {
    const request = createGetRequest({ audio_file_id: "file-123", extension: "100" });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.missing).toContain("date");
  });

  it("returns 400 when all params are missing", async () => {
    const request = createGetRequest({});
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.missing).toHaveLength(3);
  });

  it("returns detailed missing field list", async () => {
    const request = createGetRequest({ audio_file_id: "file-123" });
    const response = await GET(request);
    const data = await response.json();

    expect(data.error).toBe("Missing required parameters");
    expect(data.missing).toContain("extension");
    expect(data.missing).toContain("date");
    expect(data.provided.audio_file_id).toBe("file-123");
  });

  it("returns 500 when Supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const request = createGetRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it("returns data when record found", async () => {
    const mockRecord = {
      id: "record-1",
      audio_file_id: "file-123",
      extension: "100",
      call_date: "2024-01-01",
      todo_items: [{ text: "Follow up", completed: false }],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockRecord]),
    });

    const request = createGetRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockRecord);
  });

  it("returns null data when no record found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const request = createGetRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toBeNull();
  });

  it("returns 500 on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Server error"),
    });

    const request = createGetRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it("handles column error in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("column call_date does not exist"),
    });

    const request = createGetRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
    });
    const response = await GET(request);
    const data = await response.json();

    expect(data.error).toContain("column");
  });

  it("returns 500 on unexpected error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = createGetRequest({
      audio_file_id: "file-123",
      extension: "100",
      date: "2024-01-01",
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("Internal server error");
  });
});

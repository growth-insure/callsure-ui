import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const { POST } = await import("@/app/api/auth/forgot-password/route");

function createRequest(body: object): Request {
  return new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
    vi.stubEnv("NEXT_PUBLIC_PASSWORD_RESET_REDIRECT", "");
    vi.stubEnv("PASSWORD_RESET_REDIRECT", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("SITE_URL", "");
  });

  it("returns 400 for missing email", async () => {
    const request = createRequest({});
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain("valid email");
  });

  it("returns 400 for empty email", async () => {
    const request = createRequest({ email: "" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const request = createRequest({ email: "not-an-email" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain("valid email");
  });

  it("returns 400 for email without domain", async () => {
    const request = createRequest({ email: "user@" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 500 when Supabase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "");

    const request = createRequest({ email: "test@test.com" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toContain("unavailable");
  });

  it("returns generic success message on valid email", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const request = createRequest({ email: "user@test.com" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toContain("If an account");
  });

  it("returns generic success even when Supabase recover fails (anti-enumeration)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("User not found"),
    });

    const request = createRequest({ email: "nonexistent@test.com" });
    const response = await POST(request);

    // Should still return 200 to prevent email enumeration
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toContain("If an account");
  });

  it("calls Supabase recovery endpoint with correct URL", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const request = createRequest({ email: "user@test.com" });
    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/v1/recover"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@test.com" }),
      })
    );
  });

  it("includes redirect_to in recovery URL", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const request = createRequest({ email: "user@test.com" });
    await POST(request);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("redirect_to=");
  });

  it("uses explicit NEXT_PUBLIC_PASSWORD_RESET_REDIRECT when provided", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_PASSWORD_RESET_REDIRECT",
      "https://callsure.gi.growth.insure/reset-password"
    );
    mockFetch.mockResolvedValueOnce({ ok: true });

    const request = createRequest({ email: "user@test.com" });
    await POST(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain(
      "redirect_to=https://callsure.gi.growth.insure/reset-password"
    );
  });

  it("builds redirect from NEXT_PUBLIC_APP_URL when explicit redirect is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://callsure.gi.growth.insure");
    mockFetch.mockResolvedValueOnce({ ok: true });

    const request = createRequest({ email: "user@test.com" });
    await POST(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain(
      "redirect_to=https://callsure.gi.growth.insure/reset-password"
    );
  });

  it("falls back to request origin when app/site env vars are missing", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const request = createRequest({ email: "user@test.com" });
    await POST(request);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(decodeURIComponent(calledUrl)).toContain(
      "redirect_to=http://localhost:3000/reset-password"
    );
  });

  it("uses service role key in auth header", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const request = createRequest({ email: "user@test.com" });
    await POST(request);

    const calledOptions = mockFetch.mock.calls[0][1];
    expect(calledOptions.headers.Authorization).toContain("mock-service-role-key");
  });

  it("returns 500 on unexpected error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = createRequest({ email: "user@test.com" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toContain("couldn't process");
  });
});

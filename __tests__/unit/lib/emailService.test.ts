import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — factory must not reference outer variables
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}));

// Import AFTER mock is set up
import sgMail from "@sendgrid/mail";
import { sendWelcomeEmail } from "@/lib/emailService";

const mockSend = sgMail.send as ReturnType<typeof vi.fn>;
const mockSetApiKey = sgMail.setApiKey as ReturnType<typeof vi.fn>;

const mockEmailData = {
  to: "user@test.com",
  name: "Test User",
  temporaryPassword: "Temp123!@#",
  role: "agent",
  extension: "1001",
};

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SENDGRID_API_KEY", "test-api-key");
    vi.stubEnv("NEXT_PUBLIC_SENDGRID_FROM_EMAIL", "noreply@test.com");
  });

  it("returns false when SendGrid API key is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENDGRID_API_KEY", "");
    const result = await sendWelcomeEmail(mockEmailData);
    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sets SendGrid API key correctly", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    await sendWelcomeEmail(mockEmailData);
    expect(mockSetApiKey).toHaveBeenCalledWith("test-api-key");
  });

  it("sends email with correct parameters", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    await sendWelcomeEmail(mockEmailData);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        from: "noreply@test.com",
        subject: "Welcome to CallSure - Your Account is Ready",
      })
    );
  });

  it("returns true on successful send", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    const result = await sendWelcomeEmail(mockEmailData);
    expect(result).toBe(true);
  });

  it("returns false on SendGrid failure", async () => {
    mockSend.mockRejectedValueOnce(new Error("SendGrid error"));
    const result = await sendWelcomeEmail(mockEmailData);
    expect(result).toBe(false);
  });

  it("logs SendGrid error details when available", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sgError = { response: { body: { errors: [{ message: "Bad request" }] } } };
    mockSend.mockRejectedValueOnce(sgError);
    await sendWelcomeEmail(mockEmailData);
    expect(consoleSpy).toHaveBeenCalledWith("SendGrid Error Details:", sgError.response.body);
  });

  it("generates HTML with user name", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    await sendWelcomeEmail(mockEmailData);
    expect(mockSend.mock.calls[0][0].html).toContain("Hello Test User!");
  });

  it("generates HTML with email address", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    await sendWelcomeEmail(mockEmailData);
    expect(mockSend.mock.calls[0][0].html).toContain("user@test.com");
  });

  it("generates HTML with role", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    await sendWelcomeEmail(mockEmailData);
    expect(mockSend.mock.calls[0][0].html).toContain("agent");
  });

  it("generates HTML with extension", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    await sendWelcomeEmail(mockEmailData);
    expect(mockSend.mock.calls[0][0].html).toContain("1001");
  });

  it("generates HTML with temporary password", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    await sendWelcomeEmail(mockEmailData);
    expect(mockSend.mock.calls[0][0].html).toContain("Temp123!@#");
  });

  it("generates valid HTML document", async () => {
    mockSend.mockResolvedValueOnce([{ statusCode: 202 }]);
    await sendWelcomeEmail(mockEmailData);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });
});

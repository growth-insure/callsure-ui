import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Supabase client
const mockSetSession = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      setSession: mockSetSession,
      updateUser: mockUpdateUser,
    },
  }),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import ResetPasswordPage from "@/app/reset-password/page";

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.hash
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        ...window.location,
        hash: "",
        pathname: "/reset-password",
      },
    });
    window.history.replaceState = vi.fn();
  });

  // ============ NO TOKENS ============
  describe("When no tokens in URL", () => {
    it("shows invalid link message", () => {
      render(<ResetPasswordPage />);
      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    });

    it("shows Back to Login button", () => {
      render(<ResetPasswordPage />);
      expect(screen.getByRole("button", { name: /back to login/i })).toBeInTheDocument();
    });

    it("does not show password form", () => {
      render(<ResetPasswordPage />);
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it("navigates to login when Back to Login is clicked", async () => {
      render(<ResetPasswordPage />);
      await userEvent.click(screen.getByRole("button", { name: /back to login/i }));
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  // ============ WITH TOKENS ============
  describe("When tokens are present in URL", () => {
    beforeEach(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: {
          ...window.location,
          hash: "#access_token=test-access-token&refresh_token=test-refresh-token&expires_in=3600",
          pathname: "/reset-password",
        },
      });
    });

    it("shows password form", () => {
      render(<ResetPasswordPage />);
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    it("shows confirm password field", () => {
      render(<ResetPasswordPage />);
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("shows Update Password button", () => {
      render(<ResetPasswordPage />);
      expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
    });

    it("shows heading 'Set a new password'", () => {
      render(<ResetPasswordPage />);
      expect(screen.getByText(/set a new password/i)).toBeInTheDocument();
    });

    it("cleans hash from URL on mount", () => {
      render(<ResetPasswordPage />);
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  // ============ VALIDATION ============
  describe("Password Validation", () => {
    beforeEach(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: {
          ...window.location,
          hash: "#access_token=test-token&refresh_token=test-refresh",
          pathname: "/reset-password",
        },
      });
    });

    it("shows error for password less than 8 characters", async () => {
      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "short");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "short");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("shows error for mismatched passwords", async () => {
      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "password123");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "different123");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it("shows error for empty password", async () => {
      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/confirm password/i), "something");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  // ============ SUCCESSFUL RESET ============
  describe("Successful Password Reset", () => {
    beforeEach(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: {
          ...window.location,
          hash: "#access_token=test-token&refresh_token=test-refresh",
          pathname: "/reset-password",
        },
      });
      mockSetSession.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: null });
    });

    it("calls setSession with correct tokens", async () => {
      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "newpassword123");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "newpassword123");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(mockSetSession).toHaveBeenCalledWith({
          access_token: "test-token",
          refresh_token: "test-refresh",
        });
      });
    });

    it("calls updateUser with new password", async () => {
      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "newpassword123");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "newpassword123");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: "newpassword123",
        });
      });
    });

    it("shows success message after update", async () => {
      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "newpassword123");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "newpassword123");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
      });
    });

    it("shows log in link after success", async () => {
      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "newpassword123");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "newpassword123");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/log in/i)).toBeInTheDocument();
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    beforeEach(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: {
          ...window.location,
          hash: "#access_token=test-token&refresh_token=test-refresh",
          pathname: "/reset-password",
        },
      });
    });

    it("shows error when setSession fails", async () => {
      mockSetSession.mockResolvedValue({ error: { message: "Invalid token" } });
      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "newpassword123");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "newpassword123");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid token/i)).toBeInTheDocument();
      });
    });

    it("shows error when updateUser fails", async () => {
      mockSetSession.mockResolvedValue({ error: null });
      mockUpdateUser.mockResolvedValue({ error: { message: "Password too weak" } });

      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "newpassword123");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "newpassword123");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password too weak/i)).toBeInTheDocument();
      });
    });

    it("resets status to idle on error", async () => {
      mockSetSession.mockResolvedValue({ error: { message: "Session error" } });

      render(<ResetPasswordPage />);

      await userEvent.type(screen.getByLabelText(/new password/i), "newpassword123");
      await userEvent.type(screen.getByLabelText(/confirm password/i), "newpassword123");
      fireEvent.submit(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        // Button should be re-enabled (not showing "Updating...")
        expect(screen.getByRole("button", { name: /update password/i })).not.toBeDisabled();
      });
    });
  });
});

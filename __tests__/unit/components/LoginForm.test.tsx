import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mocks must be declared before imports that use them
const mockLogin = vi.fn();
const mockPush = vi.fn();

vi.mock("@/store/auth/store", () => ({
  useAuthStore: vi.fn(() => ({
    login: mockLogin,
    isLoading: false,
    error: null,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { LoginForm } from "@/components/auth/LoginForm";
import { useAuthStore } from "@/store/auth/store";

// Mock fetch for forgot password
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue("error");
    // Reset useAuthStore to default state so tests don't bleed into each other
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    } as any);
  });

  // ============ RENDERING ============
  describe("Rendering", () => {
    it("renders email input", () => {
      render(<LoginForm />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("renders password input", () => {
      render(<LoginForm />);
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders login button", () => {
      render(<LoginForm />);
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("renders Login heading", () => {
      render(<LoginForm />);
      expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    });

    it("renders forgot password link", () => {
      render(<LoginForm />);
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it("email input has correct type", () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("password input has correct type", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  // ============ VALIDATION ============
  describe("Validation", () => {
    it("shows error for empty email on blur", async () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email.*not allowed to be empty/i)).toBeInTheDocument();
      });
    });

    it("shows error for invalid email format on blur", async () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);

      await userEvent.type(emailInput, "invalid-email");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email.*must be a valid email/i)).toBeInTheDocument();
      });
    });

    it("shows error for empty password on blur", async () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.focus(passwordInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password.*not allowed to be empty/i)).toBeInTheDocument();
      });
    });

    it("clears email error when user starts typing", async () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);

      // Trigger error
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);
      await waitFor(() => {
        expect(screen.getByText(/email.*not allowed to be empty/i)).toBeInTheDocument();
      });

      // Start typing
      await userEvent.type(emailInput, "t");
      await waitFor(() => {
        expect(screen.queryByText(/email.*not allowed to be empty/i)).not.toBeInTheDocument();
      });
    });

    it("does not show errors before blur", () => {
      render(<LoginForm />);
      expect(screen.queryByText(/not allowed to be empty/i)).not.toBeInTheDocument();
    });
  });

  // ============ FORM SUBMISSION ============
  describe("Form Submission", () => {
    it("calls login with email and password on submit", async () => {
      mockLogin.mockResolvedValueOnce("success:admin");
      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
      await userEvent.type(screen.getByLabelText(/password/i), "password123");
      fireEvent.submit(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("admin@test.com", "password123");
      });
    });

    it("redirects to /dashboard on admin login success", async () => {
      mockLogin.mockResolvedValueOnce("success:admin");
      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), "admin@test.com");
      await userEvent.type(screen.getByLabelText(/password/i), "password123");
      fireEvent.submit(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("redirects to /dashboard on super-admin login success", async () => {
      mockLogin.mockResolvedValueOnce("success:super-admin");
      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), "sa@test.com");
      await userEvent.type(screen.getByLabelText(/password/i), "password123");
      fireEvent.submit(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("redirects to /agent on agent login success", async () => {
      mockLogin.mockResolvedValueOnce("success:agent");
      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), "agent@test.com");
      await userEvent.type(screen.getByLabelText(/password/i), "password123");
      fireEvent.submit(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/agent");
      });
    });

    it("redirects to /pending-approval on pending result", async () => {
      mockLogin.mockResolvedValueOnce("pending");
      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), "pending@test.com");
      await userEvent.type(screen.getByLabelText(/password/i), "password123");
      fireEvent.submit(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/pending-approval?from=login");
      });
    });

    it("does not redirect on error result", async () => {
      mockLogin.mockResolvedValueOnce("error");
      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), "bad@test.com");
      await userEvent.type(screen.getByLabelText(/password/i), "wrong");
      fireEvent.submit(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  // ============ LOADING STATE ============
  describe("Loading State", () => {
    it("shows 'Logging in...' when loading", () => {
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
      } as any);

      render(<LoginForm />);
      expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    });

    it("disables login button when loading", () => {
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
      } as any);

      render(<LoginForm />);
      expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();
    });
  });

  // ============ AUTH ERROR ============
  describe("Auth Error Display", () => {
    it("displays auth error from store", () => {
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: "Invalid email or password",
      } as any);

      render(<LoginForm />);
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });

    it("does not show error div when no error", () => {
      render(<LoginForm />);
      expect(screen.queryByText("Invalid email or password")).not.toBeInTheDocument();
    });
  });

  // ============ FORGOT PASSWORD ============
  describe("Forgot Password Dialog", () => {
    it("opens forgot password dialog on click", async () => {
      render(<LoginForm />);
      await userEvent.click(screen.getByText(/forgot password/i));

      await waitFor(() => {
        expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
      });
    });

    it("pre-fills forgot email from login form", async () => {
      render(<LoginForm />);
      await userEvent.type(screen.getByLabelText(/email/i), "test@email.com");
      await userEvent.click(screen.getByText(/forgot password/i));

      await waitFor(() => {
        const forgotEmailInput = screen.getByPlaceholderText(/you@example.com/i);
        expect(forgotEmailInput).toHaveValue("test@email.com");
      });
    });

    it("shows error for invalid forgot password email", async () => {
      render(<LoginForm />);
      await userEvent.click(screen.getByText(/forgot password/i));

      await waitFor(() => {
        expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), "bad-email");
      fireEvent.submit(screen.getByText(/send reset link/i));

      await waitFor(() => {
        expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
      });
    });

    it("calls forgot-password API on submit", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Reset link sent" }),
      });

      render(<LoginForm />);
      await userEvent.click(screen.getByText(/forgot password/i));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
      });

      const forgotInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.clear(forgotInput);
      await userEvent.type(forgotInput, "valid@email.com");
      fireEvent.submit(screen.getByText(/send reset link/i));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/forgot-password",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ email: "valid@email.com" }),
          })
        );
      });
    });

    it("shows error on forgot password API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Unable to send" }),
      });

      render(<LoginForm />);
      await userEvent.click(screen.getByText(/forgot password/i));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
      });

      const forgotInput = screen.getByPlaceholderText(/you@example.com/i);
      await userEvent.clear(forgotInput);
      await userEvent.type(forgotInput, "valid@email.com");
      fireEvent.submit(screen.getByText(/send reset link/i));

      await waitFor(() => {
        expect(screen.getByText(/unable to send/i)).toBeInTheDocument();
      });
    });

    it("renders cancel button in forgot password dialog", async () => {
      render(<LoginForm />);
      await userEvent.click(screen.getByText(/forgot password/i));

      await waitFor(() => {
        expect(screen.getByText(/cancel/i)).toBeInTheDocument();
      });
    });

    it("shows Send Reset Link button in dialog", async () => {
      render(<LoginForm />);
      await userEvent.click(screen.getByText(/forgot password/i));

      await waitFor(() => {
        expect(screen.getByText(/send reset link/i)).toBeInTheDocument();
      });
    });
  });
});

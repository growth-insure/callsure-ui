import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddUserModal from "@/components/admin/AddUserModal";

const mockOnClose = vi.fn();
const mockOnUserCreated = vi.fn();
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("@/store/auth/store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: "admin-123", email: "admin@test.com" },
  })),
}));

describe("AddUserModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============ RENDERING ============
  describe("Rendering", () => {
    it("renders modal when isOpen is true", () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      expect(screen.getByText(/add new user/i)).toBeInTheDocument();
    });

    it("does not render content when isOpen is false", () => {
      render(
        <AddUserModal isOpen={false} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      expect(screen.queryByText(/add new user/i)).not.toBeInTheDocument();
    });

    it("renders Full Name input", () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    it("renders Extension input", () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      expect(screen.getByLabelText(/extension/i)).toBeInTheDocument();
    });

    it("renders Email input", () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("renders Role select", () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      // Radix UI SelectTrigger renders as a combobox button
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders Create User button", () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      expect(screen.getByRole("button", { name: /create user/i })).toBeInTheDocument();
    });

    it("renders Cancel button", () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });

  // ============ VALIDATION ============
  describe("Validation", () => {
    it("shows error for empty name on blur", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name.*not allowed to be empty/i)).toBeInTheDocument();
      });
    });

    it("shows error for name less than 2 characters", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.type(nameInput, "A");
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name.*at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it("shows error for empty extension on blur", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      const extInput = screen.getByLabelText(/extension/i);
      fireEvent.focus(extInput);
      fireEvent.blur(extInput);

      await waitFor(() => {
        expect(screen.getByText(/extension.*not allowed to be empty/i)).toBeInTheDocument();
      });
    });

    it("shows error for non-numeric extension", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      const extInput = screen.getByLabelText(/extension/i);
      await userEvent.type(extInput, "abc");
      fireEvent.blur(extInput);

      await waitFor(() => {
        expect(screen.getByText(/extension.*valid number/i)).toBeInTheDocument();
      });
    });

    it("shows error for empty email on blur", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email.*not allowed to be empty/i)).toBeInTheDocument();
      });
    });

    it("shows error for invalid email format", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, "not-an-email");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email.*valid email/i)).toBeInTheDocument();
      });
    });

    it("clears error when user starts typing", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );
      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name.*not allowed to be empty/i)).toBeInTheDocument();
      });

      await userEvent.type(nameInput, "Jo");
      await waitFor(() => {
        expect(screen.queryByText(/name.*not allowed to be empty/i)).not.toBeInTheDocument();
      });
    });

    it("does not submit when form is invalid", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );

      await userEvent.click(screen.getByRole("button", { name: /create user/i }));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ============ FORM SUBMISSION ============
  describe("Form Submission", () => {
    it("calls /api/users/create with correct data on valid submit", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { name: "John Doe", email: "john@test.com" },
          }),
      });

      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );

      await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
      await userEvent.type(screen.getByLabelText(/extension/i), "1001");
      await userEvent.type(screen.getByLabelText(/email/i), "john@test.com");

      await userEvent.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/users/create",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Authorization": "Bearer admin-123",
            }),
          })
        );
      });
    });

    it("sends correct body data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { name: "John Doe", email: "john@test.com" },
          }),
      });

      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );

      await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
      await userEvent.type(screen.getByLabelText(/extension/i), "1001");
      await userEvent.type(screen.getByLabelText(/email/i), "john@test.com");

      await userEvent.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody).toEqual({
          email: "john@test.com",
          name: "John Doe",
          extension: "1001",
          role: "agent",
        });
      });
    });

    it("calls onUserCreated after successful creation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { name: "John", email: "john@test.com" },
          }),
      });

      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );

      await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
      await userEvent.type(screen.getByLabelText(/extension/i), "1001");
      await userEvent.type(screen.getByLabelText(/email/i), "john@test.com");

      await userEvent.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(mockOnUserCreated).toHaveBeenCalled();
      });
    });

    it("calls onClose after successful creation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { name: "John", email: "john@test.com" },
          }),
      });

      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );

      await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
      await userEvent.type(screen.getByLabelText(/extension/i), "1001");
      await userEvent.type(screen.getByLabelText(/email/i), "john@test.com");

      await userEvent.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("handles API error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "User already exists" }),
      });

      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );

      await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
      await userEvent.type(screen.getByLabelText(/extension/i), "1001");
      await userEvent.type(screen.getByLabelText(/email/i), "john@test.com");

      await userEvent.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
        expect(mockOnUserCreated).not.toHaveBeenCalled();
      });
    });

    it("handles network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );

      await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
      await userEvent.type(screen.getByLabelText(/extension/i), "1001");
      await userEvent.type(screen.getByLabelText(/email/i), "john@test.com");

      await userEvent.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  // ============ CANCEL / CLOSE ============
  describe("Cancel/Close", () => {
    it("calls onClose when Cancel is clicked", async () => {
      render(
        <AddUserModal isOpen={true} onClose={mockOnClose} onUserCreated={mockOnUserCreated} />
      );

      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

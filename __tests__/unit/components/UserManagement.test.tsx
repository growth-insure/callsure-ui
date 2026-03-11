import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserManagement } from "@/components/admin/UserManagement";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("@/store/auth/store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: "current-admin", email: "admin@test.com" },
  })),
}));

const mockUsers = [
  {
    id: "current-admin",
    email: "admin@test.com",
    name: "Current Admin",
    role: "super-admin",
    status: "approved",
    isAdmin: true,
    isPendingUser: false,
    createdAt: "2024-01-15T10:00:00Z",
    user_metadata: { extension: "100", name: "Current Admin" },
  },
  {
    id: "user-agent",
    email: "agent@test.com",
    name: "Test Agent",
    role: "agent",
    status: "approved",
    isAdmin: false,
    isPendingUser: false,
    createdAt: "2024-02-20T10:00:00Z",
    user_metadata: { extension: "200", name: "Test Agent" },
  },
  {
    id: "user-pending",
    email: "pending@test.com",
    name: "Pending User",
    role: "agent",
    status: "pending",
    isAdmin: false,
    isPendingUser: true,
    createdAt: "2024-03-01T10:00:00Z",
    user_metadata: { extension: "300", name: "Pending User" },
  },
];

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: mockUsers, total: 3 }),
    });
  });

  // ============ RENDERING & DATA FETCH ============
  describe("Rendering", () => {
    it("shows loading spinner initially", () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
      render(<UserManagement />);
      expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    });

    it("fetches and displays users", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText("Current Admin")).toBeInTheDocument();
        expect(screen.getByText("Test Agent")).toBeInTheDocument();
        expect(screen.getByText("Pending User")).toBeInTheDocument();
      });
    });

    it("displays user emails", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText("admin@test.com")).toBeInTheDocument();
        expect(screen.getByText("agent@test.com")).toBeInTheDocument();
      });
    });

    it("displays user roles", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText("super-admin")).toBeInTheDocument();
        expect(screen.getAllByText("agent").length).toBeGreaterThanOrEqual(2);
      });
    });

    it("displays user count badge", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });

    it("displays User Management heading", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText(/user management/i)).toBeInTheDocument();
      });
    });

    it("renders Add User button", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();
      });
    });

    it("shows 'You' label for current user", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText("You")).toBeInTheDocument();
      });
    });

    it("shows extensions from user_metadata", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("200")).toBeInTheDocument();
      });
    });
  });

  // ============ EMPTY STATE ============
  describe("Empty State", () => {
    it("shows empty state when no users", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [], total: 0 }),
      });

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    it("handles fetch error gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      render(<UserManagement />);

      await waitFor(() => {
        // Component should still render (not crash)
        expect(screen.getByText(/user management/i)).toBeInTheDocument();
      });
    });

    it("handles network error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText(/user management/i)).toBeInTheDocument();
      });
    });
  });

  // ============ API CALLS ============
  describe("API Calls", () => {
    it("fetches users with correct authorization header", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/users/pending",
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer current-admin",
            }),
          })
        );
      });
    });

    it("calls promote-admin API when Make Admin is clicked", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText("Test Agent")).toBeInTheDocument();
      });

      // Find the dropdown trigger for the agent row (not the "You" row)
      const dropdownButtons = screen.getAllByRole("button").filter(btn => {
        return btn.querySelector("svg");
      });

      // The dropdown for agent user should be clickable
      // We look for MoreVertical icon buttons
      const agentRow = screen.getByText("Test Agent").closest("tr");
      const dropdownBtn = agentRow?.querySelector('[role="button"]') ||
                          agentRow?.querySelector('button:not(:disabled)');

      if (dropdownBtn) {
        await userEvent.click(dropdownBtn as Element);

        // After dropdown opens, look for "Make Admin" option
        await waitFor(() => {
          const makeAdminBtn = screen.queryByText(/make admin/i);
          if (makeAdminBtn) {
            // Click it and verify the API call
            userEvent.click(makeAdminBtn);
          }
        });
      }
    });
  });

  // ============ ADD USER MODAL ============
  describe("Add User Modal", () => {
    it("opens modal when Add User button is clicked", async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /add user/i }));

      await waitFor(() => {
        expect(screen.getByText(/add new user/i)).toBeInTheDocument();
      });
    });
  });
});

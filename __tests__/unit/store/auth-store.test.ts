import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Reset zustand store between tests
const { useAuthStore } = await import("@/store/auth/store");

function resetStore() {
  act(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });
}

const mockUser = {
  id: "user-123",
  email: "admin@test.com",
  user_metadata: { name: "Admin", role: "admin", extension: "100" },
  app_metadata: { role: "admin", isAdmin: true, status: "approved" },
};

const mockAgentUser = {
  id: "user-456",
  email: "agent@test.com",
  user_metadata: { name: "Agent", role: "agent", extension: "200" },
  app_metadata: { role: "agent", isAdmin: false, status: "approved" },
};

const mockPendingUser = {
  id: "user-789",
  email: "pending@test.com",
  user_metadata: { name: "Pending", role: "agent" },
  app_metadata: { role: "agent", isAdmin: false, status: "pending" },
};

describe("Auth Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  // ============ INITIAL STATE ============
  describe("Initial State", () => {
    it("starts with null user", () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("starts with isAuthenticated false", () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("starts with isLoading false", () => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("starts with null error", () => {
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ============ LOGIN ============
  describe("login", () => {
    it("sets isLoading to true during login", async () => {
      let loadingDuringRequest = false;
      mockFetch.mockImplementation(() => {
        loadingDuringRequest = useAuthStore.getState().isLoading;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ user: mockUser }),
        });
      });

      await act(async () => {
        await useAuthStore.getState().login("admin@test.com", "password");
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it("clears error before login attempt", async () => {
      useAuthStore.setState({ error: "previous error" });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockUser }),
      });

      await act(async () => {
        await useAuthStore.getState().login("admin@test.com", "password");
      });

      expect(useAuthStore.getState().error).toBeNull();
    });

    it("returns success:admin for admin role", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockUser }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("admin@test.com", "password");
      });

      expect(result).toBe("success:admin");
    });

    it("returns success:agent for agent role", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockAgentUser }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("agent@test.com", "password");
      });

      expect(result).toBe("success:agent");
    });

    it("returns success:super-admin for super-admin role", async () => {
      const superAdminUser = {
        ...mockUser,
        app_metadata: { role: "super-admin", isAdmin: true, status: "approved" },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: superAdminUser }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("admin@test.com", "password");
      });

      expect(result).toBe("success:super-admin");
    });

    it("defaults to agent role when no role metadata present", async () => {
      const noRoleUser = {
        id: "user-x",
        email: "x@test.com",
        user_metadata: {},
        app_metadata: {},
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: noRoleUser }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("x@test.com", "password");
      });

      expect(result).toBe("success:agent");
    });

    it("sets user and isAuthenticated on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockUser }),
      });

      await act(async () => {
        await useAuthStore.getState().login("admin@test.com", "password");
      });

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("clears isLoading on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockUser }),
      });

      await act(async () => {
        await useAuthStore.getState().login("admin@test.com", "password");
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("returns pending when user status is pending in app_metadata", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockPendingUser }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("pending@test.com", "password");
      });

      expect(result).toBe("pending");
    });

    it("returns pending when user status is pending in user_metadata", async () => {
      const pendingInUserMeta = {
        id: "user-p",
        email: "p@test.com",
        user_metadata: { status: "pending" },
        app_metadata: {},
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: pendingInUserMeta }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("p@test.com", "password");
      });

      expect(result).toBe("pending");
    });

    it("does not set user when pending", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockPendingUser }),
      });

      await act(async () => {
        await useAuthStore.getState().login("pending@test.com", "password");
      });

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("returns error for invalid credentials (non-200 response)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("bad@test.com", "wrong");
      });

      expect(result).toBe("error");
    });

    it("sets error message on invalid credentials", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await act(async () => {
        await useAuthStore.getState().login("bad@test.com", "wrong");
      });

      expect(useAuthStore.getState().error).toBe("Invalid email or password");
    });

    it("handles email_not_confirmed error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error_code: "email_not_confirmed" }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("unconfirmed@test.com", "pass");
      });

      expect(result).toBe("error");
      expect(useAuthStore.getState().error).toContain("confirmation link");
    });

    it("handles email_not_confirmed via msg field", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ msg: "Email not confirmed" }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("unconfirmed@test.com", "pass");
      });

      expect(result).toBe("error");
    });

    it("returns pending when 400 response indicates pending approval", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ msg: "Account is pending approval" }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("pending@test.com", "pass");
      });

      expect(result).toBe("pending");
    });

    it("clears isLoading on error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await act(async () => {
        await useAuthStore.getState().login("bad@test.com", "wrong");
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("handles network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().login("test@test.com", "pass");
      });

      expect(result).toBe("error");
      expect(useAuthStore.getState().error).toBe("Invalid email or password");
    });

    it("calls Supabase token endpoint with correct parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: mockUser }),
      });

      await act(async () => {
        await useAuthStore.getState().login("admin@test.com", "password123");
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/v1/token?grant_type=password"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"email":"admin@test.com"'),
        })
      );
    });
  });

  // ============ SIGNUP ============
  describe("signup", () => {
    it("blocks temporary email domains", async () => {
      await act(async () => {
        await useAuthStore.getState().signup({
          email: "test@yopmail.com",
          password: "password123",
          name: "Test",
          role: "agent",
        });
      });

      expect(useAuthStore.getState().error).toContain("Temporary email services");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("blocks guerrillamail.com domain", async () => {
      await act(async () => {
        await useAuthStore.getState().signup({
          email: "test@guerrillamail.com",
          password: "password123",
          name: "Test",
          role: "agent",
        });
      });

      expect(useAuthStore.getState().error).toContain("Temporary email services");
    });

    it("blocks 10minutemail.com domain", async () => {
      await act(async () => {
        await useAuthStore.getState().signup({
          email: "test@10minutemail.com",
          password: "password123",
          name: "Test",
          role: "agent",
        });
      });

      expect(useAuthStore.getState().error).toContain("Temporary email services");
    });

    it("sets isLoading during signup", async () => {
      let loadingDuringRequest = false;
      mockFetch.mockImplementation(() => {
        loadingDuringRequest = useAuthStore.getState().isLoading;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: "new-user" } }),
        });
      });

      await act(async () => {
        await useAuthStore.getState().signup({
          email: "valid@company.com",
          password: "password123",
          name: "Valid User",
          role: "agent",
        });
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it("calls Supabase signup endpoint on valid email", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: { id: "new-user" } }),
      });

      await act(async () => {
        await useAuthStore.getState().signup({
          email: "valid@company.com",
          password: "password123",
          name: "Valid User",
          role: "agent",
        });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/v1/signup"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("calls update-metadata after successful signup", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: { id: "new-user" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      await act(async () => {
        await useAuthStore.getState().signup({
          email: "valid@company.com",
          password: "password123",
          name: "Valid User",
          role: "agent",
        });
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        "/api/users/update-metadata",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"status":"pending"'),
        })
      );
    });

    it("handles Supabase signup failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "User already exists" }),
      });

      await act(async () => {
        await useAuthStore.getState().signup({
          email: "existing@company.com",
          password: "password123",
          name: "Existing",
          role: "agent",
        });
      });

      expect(useAuthStore.getState().error).toBe("User already exists");
    });

    it("handles missing userId in signup response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}), // No user/id in response
      });

      await act(async () => {
        await useAuthStore.getState().signup({
          email: "valid@company.com",
          password: "password123",
          name: "Valid",
          role: "agent",
        });
      });

      // Should still handle gracefully (error thrown for no userId)
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("clears isLoading on signup failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Signup failed" }),
      });

      await act(async () => {
        await useAuthStore.getState().signup({
          email: "test@company.com",
          password: "password123",
          name: "Test",
          role: "agent",
        });
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("allows legitimate email domains", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: { id: "new-user" } }),
      });

      await act(async () => {
        await useAuthStore.getState().signup({
          email: "test@gmail.com",
          password: "password123",
          name: "Gmail User",
          role: "agent",
        });
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ============ LOGOUT ============
  describe("logout", () => {
    it("clears user", () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      act(() => {
        useAuthStore.getState().logout();
      });
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("sets isAuthenticated to false", () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      act(() => {
        useAuthStore.getState().logout();
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("clears error", () => {
      useAuthStore.setState({ error: "some error" });
      act(() => {
        useAuthStore.getState().logout();
      });
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ============ CLEAR ERROR ============
  describe("clearError", () => {
    it("sets error to null", () => {
      useAuthStore.setState({ error: "some error" });
      act(() => {
        useAuthStore.getState().clearError();
      });
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ============ VALIDATE SESSION ============
  describe("validateSession", () => {
    it("returns invalid when no user in store", async () => {
      let result: any;
      await act(async () => {
        result = await useAuthStore.getState().validateSession();
      });
      expect(result).toEqual({ valid: false, user: null });
    });

    it("returns valid with user data on successful validation", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: "user-123", email: "admin@test.com" } }),
      });

      let result: any;
      await act(async () => {
        result = await useAuthStore.getState().validateSession();
      });

      expect(result.valid).toBe(true);
      expect(result.user).toEqual({ id: "user-123", email: "admin@test.com" });
    });

    it("logs out user on API failure", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      await act(async () => {
        await useAuthStore.getState().validateSession();
      });

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("logs out user on network error", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        await useAuthStore.getState().validateSession();
      });

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("calls validate endpoint with correct userId", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      });

      await act(async () => {
        await useAuthStore.getState().validateSession();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/validate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ userId: "user-123" }),
        })
      );
    });
  });

  // ============ CHECK USER STATUS ============
  describe("checkUserStatus", () => {
    it("returns error when no user in store", async () => {
      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserStatus();
      });
      expect(result).toBe("error");
    });

    it("returns pending for pending user", async () => {
      useAuthStore.setState({ user: { ...mockPendingUser, name: "Pending", role: "agent", status: "pending", createdAt: "", app_metadata: { isAdmin: false, agentId: "" } } as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          users: [{ id: "user-789", status: "pending", isPendingUser: true }],
        }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserStatus();
      });

      expect(result).toBe("pending");
    });

    it("returns approved for active user", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          users: [{ id: "user-123", status: "approved", isPendingUser: false }],
        }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserStatus();
      });

      expect(result).toBe("approved");
    });

    it("returns error on API failure", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserStatus();
      });

      expect(result).toBe("error");
    });

    it("returns error on network failure", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserStatus();
      });

      expect(result).toBe("error");
    });
  });

  // ============ CHECK USER ROLE ============
  describe("checkUserRole", () => {
    it("returns error when no user in store", async () => {
      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserRole();
      });
      expect(result).toBe("error");
    });

    it("returns user role from API", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          users: [{ id: "user-123", role: "admin" }],
        }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserRole();
      });

      expect(result).toBe("admin");
    });

    it("returns agent as default role", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          users: [{ id: "user-123" }], // no role field
        }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserRole();
      });

      expect(result).toBe("agent");
    });

    it("returns error on API failure", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserRole();
      });

      expect(result).toBe("error");
    });

    it("returns error when user not found in response", async () => {
      useAuthStore.setState({ user: mockUser as any, isAuthenticated: true });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          users: [{ id: "other-user", role: "admin" }], // different user
        }),
      });

      let result: string = "";
      await act(async () => {
        result = await useAuthStore.getState().checkUserRole();
      });

      expect(result).toBe("error");
    });
  });
});

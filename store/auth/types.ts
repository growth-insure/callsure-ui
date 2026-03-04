export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  user_metadata?: {
    status?: "pending" | "approved" | "rejected";
    name?: string;
    extension?: string;
    role?: string;
  };
  app_metadata: {
    isAdmin: boolean;
    agentId: string;
    status?: "pending" | "approved" | "rejected";
  };
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role: "agent";
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<`success:${string}` | "pending" | "error">;
  signup: (signupData: SignupData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

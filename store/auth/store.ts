import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AuthStore, SignupData } from "./types";
// import { toast } from "react-toastify"; // Import toast
import { toast } from "sonner";

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (
          email: string,
          password: string
        ): Promise<`success:${string}` | "pending" | "error"> => {
          set({ isLoading: true, error: null });
          try {
            // Replace with your actual API endpoint
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Only need the anon key here
                },
                body: JSON.stringify({
                  email,
                  password,
                  gotrue_meta_security: {},
                }),

                /*  body: JSON.stringify({
                  email: "kiran@givemeinsurance.com",
                  password: "justBooks12#$",
                  gotrue_meta_security: {},
                }), */
              }
            );

            if (!response.ok) {
              // Check if it's a user confirmation issue
              if (response.status === 400) {
                const errorData = await response.json();
                // console.log("Login error data:", errorData);
                
                if (errorData.error_code === "email_not_confirmed" || 
                    errorData.msg?.includes("Email not confirmed")) {
                  // User needs to confirm email first
                  set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: "Please check your email and click the confirmation link before logging in.",
                  });
                  toast.error("Please check your email and click the confirmation link before logging in.");
                  return "error";
                }
                
                if (errorData.msg?.includes("pending") ||
                    errorData.error_description?.includes("pending")) {
                  // This might be a pending user trying to login
                  throw new Error("PENDING_APPROVAL");
                }
              }
              throw new Error("Invalid credentials");
            }
            // console.log("Response:", response.status);
            if (response.status === 200) {
              const data = await response.json();
              // console.log("Login response data:", data);
              
              // Check user status from metadata
              const userMetadata = data.user?.user_metadata || {};
              const appMetadata = data.user?.app_metadata || {};
              
              // console.log("User metadata:", userMetadata);
              // console.log("App metadata:", appMetadata);
              
              const status = appMetadata.status || userMetadata.status;
              // console.log("User status:", status);
              
              if (status === "pending") {
                // console.log("User is pending approval");
                set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: null,
                });
                toast.info("Your account is pending admin approval. Please wait for approval.");
                return "pending";
              }
              
              // User is not pending, proceed with login
              const role = appMetadata.role || userMetadata.role || "agent";
              // console.log("=== LOGIN SUCCESS IN STORE ===");
              // console.log("Setting auth state - user:", data.user?.id, "role:", role, "isAuthenticated: true");
              set({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
              });
              // console.log("Auth state set successfully");
              return `success:${role}`;
            }
            return "error";
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Login failed";
            
            if (errorMessage === "PENDING_APPROVAL") {
              // User exists but is pending approval
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              toast.info("Your account is pending admin approval. Please wait for approval.");
              return "pending";
            }
            
            set({
              error: "Invalid email or password",
              isLoading: false,
            });
            toast.error("Invalid email or password"); // Show toast notification
            // console.log("Error:", error);
            return "error";
          }
        },

        logout: () => {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        },

        signup: async (signupData: SignupData) => {
          set({ isLoading: true, error: null });
          
          // Block dummy email services
          const blockedDomains = [
            'mailinato.com', 'yopmail.com', '10minutemail.com', 'guerrillamail.com',
            'tempmail.org', 'temp-mail.org', 'throwaway.email', 'getnada.com',
            'maildrop.cc', 'sharklasers.com', 'guerrillamail.biz', 'guerrillamail.de',
            'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
            'pokemail.net', 'spam4.me', 'bccto.me', 'chacuo.net', 'dispostable.com',
            'mailnesia.com', 'mailcatch.com', 'mailmetrash.com', 'trashmail.net',
            'trashmail.com', 'trashmail.org', 'trashmailer.com', 'trashymail.com',
            'trashymail.net', 'trashymail.org', 'trashymailer.com', 'trashymailer.net',
            'trashymailer.org', 'trashymailer.com', 'trashymailer.net', 'trashymailer.org'
          ];
          
          const emailDomain = signupData.email.split('@')[1]?.toLowerCase();
          if (blockedDomains.includes(emailDomain)) {
            set({
              error: "Please use a valid email address. Temporary email services are not allowed.",
              isLoading: false,
            });
            toast.error("Please use a valid email address. Temporary email services are not allowed.");
            return;
          }
          
          try {
            // Signup with Supabase (only user_metadata is supported with anon key)
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                },
                body: JSON.stringify({
                  email: signupData.email,
                  password: signupData.password,
                  user_metadata: {
                    name: signupData.name,
                    role: signupData.role,
                  },
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Signup failed");
            }

            const data = await response.json();
            // console.log("Signup successful:", data);
            // console.log("Signup response structure:", JSON.stringify(data, null, 2));

            // After successful signup, update the user's app_metadata with status using service role
            try {
              // Check if user exists in response
              const userId = data.user?.id || data.id;
              if (!userId) {
                // console.log("No user ID found in signup response");
                throw new Error("No user ID in signup response");
              }

              // console.log("Updating metadata for user ID:", userId);

              const updateResponse = await fetch("/api/users/update-metadata", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: userId,
                  app_metadata: {
                    role: signupData.role,
                    status: "pending",
                    isAdmin: false,
                  },
                  user_metadata: {
                    name: signupData.name,
                    role: signupData.role,
                    status: "pending",
                    createdAt: new Date().toISOString(),
                  }
                }),
              });

              if (updateResponse.ok) {
                // console.log("User metadata updated successfully");
              } else {
                console.log("Failed to update metadata, but signup was successful");
              }
            } catch (error) {
              console.log("Error updating metadata:", error);
            }

            set({
              isLoading: false,
            });

            toast.success("Account created successfully! Please wait for admin approval.");
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Signup failed";
            set({
              error: errorMessage,
              isLoading: false,
            });
            toast.error(errorMessage);
            console.log("Signup error:", error);
          }
        },

        clearError: () => set({ error: null }),

        // Session management
        validateSession: async () => {
          const { user } = get();
          if (!user) {
            return { valid: false, user: null };
          }

          try {
            const response = await fetch("/api/auth/validate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: user.id }),
            });

            if (response.ok) {
              const data = await response.json();
              return { valid: true, user: data.user };
            } else {
              // Token invalid, logout user
              set({
                user: null,
                isAuthenticated: false,
                error: null,
              });
              return { valid: false, user: null };
            }
          } catch (error) {
            console.error("Session validation error:", error);
            // On error, logout for security
            set({
              user: null,
              isAuthenticated: false,
              error: null,
            });
            return { valid: false, user: null };
          }
        },

        checkUserStatus: async () => {
          const { user } = get();
          if (!user) return "error";

          try {
            const response = await fetch("/api/users/pending", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.id}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const currentUser = data.users.find((u: any) => u.id === user.id);
              
              if (currentUser) {
                if (currentUser.status === "pending" || currentUser.isPendingUser) {
                  return "pending";
                } else {
                  // User is not pending, consider them active
                  return "approved";
                }
              }
            }
            return "error";
          } catch (error) {
            console.error("User status check error:", error);
            return "error";
          }
        },

        checkUserRole: async () => {
          const { user } = get();
          if (!user) return "error";

          try {
            const response = await fetch("/api/users/pending", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.id}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const currentUser = data.users.find((u: any) => u.id === user.id);
              
              if (currentUser) {
                // Return the user's role
                return currentUser.role || "agent";
              }
            }
            return "error";
          } catch (error) {
            console.error("User role check error:", error);
            return "error";
          }
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);

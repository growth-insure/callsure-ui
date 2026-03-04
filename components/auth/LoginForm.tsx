"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/store/authStore";
import { AtSign, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth/store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error: authError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const [loginLogo, setLoginLogo] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  useEffect(() => {
    // Safe to access process.env in client now
    setLoginLogo(process.env.NEXT_PUBLIC_LOGIN_LOGO || null);
  }, []);
  // Removed automatic redirect - let user manually login
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = `"email" is not allowed to be empty`;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = `"email" must be a valid email`;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = `"password" is not allowed to be empty`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Clear error when user starts typing
    if (errors[id as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }
  };
  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    validateForm();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // console.log("=== LOGIN SUBMIT ===");
    try {
      const result = await login(formData.email, formData.password);
      // console.log("Login result:", result);
      
      if (result === "pending") {
        // console.log("Redirecting to pending approval");
        router.push("/pending-approval?from=login");
      } else if (result.startsWith("success:")) {
        const role = result.split(":")[1];
        // console.log("Login successful, role:", role);
        
        if (role === "admin" || role === "super-admin") {
          // console.log("Redirecting to dashboard for admin/super-admin");
          router.push("/dashboard");
        } else {
          // console.log("Redirecting to agent page for agent");
          router.push("/agent");
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSendingReset(true);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data?.message || "Unable to send password reset email right now.");
        return;
      }

      toast.success(data?.message || "If that email exists, a reset link has been sent.");
      setIsForgotOpen(false);
      setForgotEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);
      setForgotError("Something went wrong. Please try again later.");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
          {loginLogo && <Image
            src={loginLogo!}
            alt="Logo"
            width={250}
            height={80}
            className="mb-2"
          />}
          <h1 className="text-2xl font-semibold">Login</h1>

          {authError && (
            <div className="w-full p-3 text-sm text-red-500 bg-red-50 rounded">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <AtSign
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  className={`bg-[#f0f7ff] pl-10 ${
                    touched.email && errors.email ? "border-red-500" : ""
                  }`}
                  required
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  className={`bg-[#f0f7ff] pl-10 ${
                    touched.password && errors.password ? "border-red-500" : ""
                  }`}
                  required
                />
              </div>
              {touched.password && errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#00BFA5] hover:bg-[#00BFA5]/90"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(formData.email);
                  setForgotError(null);
                  setIsForgotOpen(true);
                }}
                className="text-[#00BFA5] hover:underline text-sm"
              >
                Forgot Password?
              </button>
            </div>
          </form>
      <Dialog
        open={isForgotOpen}
        onOpenChange={(open) => {
          setIsForgotOpen(open);
          if (!open) {
            setForgotError(null);
            setIsSendingReset(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="bg-[#00BFA5] text-white px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Reset your password
              </DialogTitle>
              <DialogDescription className="text-white/80">
                Enter the email associated with your account and we&lsquo;ll send you instructions to create a new password.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleForgotPasswordSubmit}>
            <div className="px-6 py-6 space-y-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-sm font-medium text-gray-600">
                  Email address
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-[#f0f7ff] border border-transparent focus-visible:ring-[#00BFA5]"
                  required
                />
                {forgotError && (
                  <p className="text-sm text-red-500">{forgotError}</p>
                )}
                <p className="text-xs text-gray-500">
                  We&lsquo;ll send a reset link if this email is registered with Reliance Group.
                </p>
              </div>
            </div>
            <DialogFooter className="bg-gray-50 px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-gray-600"
                onClick={() => setIsForgotOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-white"
                disabled={isSendingReset}
              >
                {isSendingReset ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth/store";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
}

export function SignupForm() {
  const router = useRouter();
  const { signup, isLoading, error: authError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [loginLogo, setLoginLogo] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    name: false,
  });

  useEffect(() => {
    // Safe to access process.env in client now
    setLoginLogo(process.env.NEXT_PUBLIC_LOGIN_LOGO || null);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = `"name" is not allowed to be empty`;
    } else if (formData.name.length < 2) {
      newErrors.name = `"name" must be at least 2 characters`;
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = `"email" is not allowed to be empty`;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = `"email" must be a valid email`;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = `"password" is not allowed to be empty`;
    } else if (formData.password.length < 6) {
      newErrors.password = `"password" must be at least 6 characters`;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = `"confirm password" is not allowed to be empty`;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = `"passwords" do not match`;
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
    if (!validateForm()) return;

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: "agent",
      });
      
      // Redirect to pending approval page
      router.push("/pending-approval");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 pt-4">
      {loginLogo && (
        <Image
          src={loginLogo!}
          alt="Logo"
          width={250}
          height={80}
          className="mb-2"
        />
      )}
      <h1 className="text-2xl font-semibold">Sign Up</h1>

          {authError && (
            <div className="w-full p-3 text-sm text-red-500 bg-red-50 rounded">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("name")}
                  className={`bg-[#f0f7ff] pl-10 ${
                    touched.name && errors.name ? "border-red-500" : ""
                  }`}
                  required
                />
              </div>
              {touched.name && errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={`bg-[#f0f7ff] pl-10 ${
                    touched.confirmPassword && errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  required
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#00BFA5] hover:bg-[#00BFA5]/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#00BFA5] hover:underline"
                >
                  Login
                </Link>
              </p>
            </div>
          </form>
    </div>
  );
}

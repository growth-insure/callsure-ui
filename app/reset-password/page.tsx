"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

type TokenState = {
  access_token: string;
  refresh_token: string;
  expires_in?: string | null;
};

const parseHashTokens = (): TokenState | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const expires_in = params.get("expires_in");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, expires_in };
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [tokens, setTokens] = useState<TokenState | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "submitting">(
    "idle"
  );

  useEffect(() => {
    const parsed = parseHashTokens();
    if (parsed) {
      setTokens(parsed);
      // Clean hash from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  const disabled = useMemo(() => {
    return status === "submitting" || !tokens || !supabase;
  }, [status, tokens, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tokens) {
      setError("Invalid or expired reset link.");
      return;
    }

    if (!supabase || !supabaseUrl || !supabaseAnonKey) {
      setError("Supabase configuration missing. Please contact support.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setStatus("submitting");
      // establish session using recovery tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });

      if (sessionError) {
        throw new Error(
          sessionError.message || "Invalid or expired recovery link."
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setStatus("success");
      toast.success("Password updated. You can now log in.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-gray-200">
        <CardContent className="space-y-6 py-8 px-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Set a new password
            </h1>
            <p className="text-sm text-gray-600">
              {tokens
                ? "Enter your new password below."
                : "This reset link is invalid or has expired."}
            </p>
          </div>

          {tokens ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
              {status === "success" && (
                <p className="text-sm text-green-600 text-center">
                  Password updated successfully. You can now{" "}
                  <button
                    type="button"
                    className="text-[#00BFA5] underline"
                    onClick={() => router.push("/login")}
                  >
                    log in
                  </button>
                  .
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-[#00BFA5] hover:bg-[#00BFA5]/90"
                disabled={disabled || status === "success"}
              >
                {status === "submitting" ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                The reset link seems invalid or has already been used. Please
                request a new one.
              </p>
              <Button
                className="bg-[#00BFA5] hover:bg-[#00BFA5]/90"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


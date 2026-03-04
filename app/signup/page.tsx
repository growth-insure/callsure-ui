"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page since signup is now admin-only
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen w-full flex justify-center p-4 py-8">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sign Up Not Available
            </h2>
            <p className="text-gray-600 mb-4">
              User registration is now handled by administrators only.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your administrator to create an account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

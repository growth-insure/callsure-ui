"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle } from "lucide-react";

function PendingApprovalContent() {
  const [loginLogo, setLoginLogo] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const fromLogin = searchParams.get("from") === "login";

  useEffect(() => {
    setLoginLogo(process.env.NEXT_PUBLIC_LOGIN_LOGO || null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            {loginLogo && (
              <Image
                src={loginLogo!}
                alt="Logo"
                width={250}
                height={80}
                className="mb-2"
              />
            )}
            
            <div className="flex flex-col items-center space-y-4">
              <Clock className="w-16 h-16 text-yellow-500" />
              <h1 className="text-2xl font-semibold text-center">
                Account Pending Approval
              </h1>
              <p className="text-gray-600 text-center">
                {fromLogin 
                  ? "Your account exists but is still waiting for admin approval. Please wait for approval before accessing the system."
                  : "Your account has been created successfully and is now waiting for admin approval."
                }
              </p>
            </div>

            <div className="w-full space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-blue-700">
                  Account created successfully
                </span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-yellow-700">
                  Waiting for admin approval
                </span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Access will be granted after approval
                </span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                You will receive an email notification once your account is approved.
              </p>
              <p className="text-sm text-gray-500">
                If you have any questions, please contact your administrator.
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button
                onClick={() => window.location.href = "/login"}
                className="w-full bg-[#00BFA5] hover:bg-[#00BFA5]/90"
              >
                Back to Login
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Check Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <PendingApprovalContent />
    </Suspense>
  );
}

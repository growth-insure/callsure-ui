"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserManagement } from "@/components/admin/UserManagement";
import Navbar from "../components/Navbar";

export default function DashboardUsersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication and role
    const authData = localStorage.getItem('auth-storage');
    if (!authData) {
      router.push("/login");
      return;
    }
    
    try {
      const parsed = JSON.parse(authData);
      if (!parsed.state?.user || !parsed.state?.isAuthenticated) {
        router.push("/login");
        return;
      }

      // Check if user has super-admin role to access user management
      const user = parsed.state.user;
      const userRole = user.app_metadata?.role || user.user_metadata?.role;
      const isSuperAdmin = user.app_metadata?.isAdmin || userRole === "admin" || userRole === "super-admin";
      
      if (!isSuperAdmin) {
        // User is not super-admin, redirect to appropriate page
        if (userRole === "agent") {
          router.push("/agent");
        } else {
          router.push("/dashboard");
        }
        return;
      }
    } catch {
      router.push("/login");
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BFA5] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user registrations and approvals</p>
        </div>
        
        <UserManagement />
      </main>
    </>
  );
}

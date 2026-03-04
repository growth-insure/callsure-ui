"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../dashboard/components/Navbar";
import AgentCalendar from "./components/AgentCalander";

const AgentPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple check: if no user in localStorage, redirect to login
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

      // Check if user is admin/super-admin - if so, redirect to dashboard
      const user = parsed.state.user;
      const userRole = user.app_metadata?.role || user.user_metadata?.role;
      const isAdmin = user.app_metadata?.isAdmin || userRole === "admin" || userRole === "super-admin";
      
      if (isAdmin) {
        // User is admin, redirect to dashboard
        router.push("/dashboard");
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
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto p-4">
        <AgentCalendar />
      </main>
    </div>
  );
};

export default AgentPage;

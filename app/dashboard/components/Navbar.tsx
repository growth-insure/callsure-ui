"use client";
import { useAuthStore } from "@/store/auth/store";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Navbar = () => {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Check if user is super-admin
  const isSuperAdmin = user?.app_metadata?.isAdmin || user?.role === "admin";

  // Helper function to extract user initials
  const getUserInitials = () => {
    if (!user) return "U";
    
    const name = user.user_metadata?.name || user.email?.split('@')[0] || '';
    
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        // First letter of first name + first letter of last name
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      } else {
        // Single name - use first two letters
        return name.substring(0, 2).toUpperCase();
      }
    }
    
    // Fallback to email initials
    const emailPrefix = user.email?.split('@')[0] || '';
    return emailPrefix.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <nav className="bg-gray-900 text-white p-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href={isSuperAdmin ? "/dashboard" : "/agent"} className="text-xl font-bold hover:text-[#00BFA5] transition-colors">
            CALL LOG ANALYTICS
          </Link>
          {isSuperAdmin && (
            <>
              <Link 
                href="/dashboard" 
                className="text-sm hover:text-[#00BFA5] transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/users" 
                className="text-sm hover:text-[#00BFA5] transition-colors"
              >
                User Management
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* User Initials Logo */}
          <div className="bg-gradient-to-r from-[#00BFA5] to-[#00BFA5]/80 px-3 py-1 rounded-lg text-white text-sm font-bold shadow-sm">
            {getUserInitials()}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="bg-[#00BFA5] hover:bg-[#00BFA5]/90"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

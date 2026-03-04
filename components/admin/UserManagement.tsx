"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Mail, Calendar, MoreVertical, Shield, ShieldOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddUserModal from "./AddUserModal";

interface PendingUser {
  id: string;
  email: string;
  name: string;
  extension?: string; // Optional since it comes from user_metadata
  role: "agent" | "admin" | "super-admin";
  status: "pending" | "approved" | "rejected"; // Status field kept for backward compatibility but approve/reject flow removed
  isAdmin: boolean;
  isPendingUser: boolean; // Flag to identify truly pending users
  createdAt: string;
  user_metadata?: {
    extension?: string;
    name?: string;
    role?: string;
    [key: string]: unknown;
  };
}

type FilterType = "all" | "pending" | "admins";

export function UserManagement() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter] = useState<FilterType>("all");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { user: currentUser } = useAuthStore();

  const fetchPendingUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users/pending", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser?.id}`, // Send user ID as auth token
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // Filter users based on active filter
  const filteredUsers = users.filter(user => {
    switch (activeFilter) {
      case "pending":
        return user.isPendingUser;
      case "admins":
        return user.isAdmin;
      case "all":
      default:
        return true;
    }
  });

  // Get counts for each filter
  const counts = {
    all: users.length,
    pending: users.filter(user => user.isPendingUser).length,
    admins: users.filter(user => user.isAdmin).length,
  };

  const handlePromoteAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const response = await fetch(`/api/users/promote-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser?.id}`,
        },
        body: JSON.stringify({ userId, isAdmin }),
      });

      if (response.ok) {
        toast.success(`User ${isAdmin ? 'promoted to admin' : 'demoted from admin'} successfully`);
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId
              ? { ...user, isAdmin, role: isAdmin ? "super-admin" : "agent" }
              : user
          )
        );
        setTimeout(() => {
          fetchPendingUsers();
        }, 1000);
      } else {
        toast.error(`Failed to ${isAdmin ? 'promote' : 'demote'} user`);
      }
    } catch (error) {
      console.error(`Error promoting user:`, error);
      toast.error(`Error promoting user`);
    }
  };

  // const getStatusBadge = (status: string) => {
  //   switch (status) {
  //     case "pending":
  //       return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  //     case "approved":
  //       return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
  //     case "rejected":
  //       return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
  //     default:
  //       return <Badge variant="secondary">{status}</Badge>;
  //   }
  // };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00BFA5]"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              <User className="w-5 h-5" />
              <span>User Management</span>
              <div className="flex items-center space-x-2">
                <div className="bg-[#00BFA5] text-white px-3 py-1 rounded-lg text-lg font-bold">
                  {counts[activeFilter]}
                </div>
                {/* <span className="text-sm text-gray-500 font-medium">
                  {activeFilter === "all" ? "users" : activeFilter}
                </span> */}
              </div>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="bg-[#00BFA5] hover:bg-[#00BFA5]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
              <AddUserModal 
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onUserCreated={fetchPendingUsers}
              />
            </div>
          </div>
          
          {/* <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">Filter by:</span>
            <div className="flex space-x-1">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className="text-xs"
              >
                All ({counts.all})
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("pending")}
                className="text-xs"
              >
                Pending ({counts.pending})
              </Button>
              <Button
                variant={activeFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("approved")}
                className="text-xs"
              >
                Approved ({counts.approved})
              </Button>
              <Button
                variant={activeFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("rejected")}
                className="text-xs"
              >
                Rejected ({counts.rejected})
              </Button>
              <Button
                variant={activeFilter === "admins" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("admins")}
                className="text-xs"
              >
                Admins ({counts.admins})
              </Button>
            </div>
          </div> */}
        </div>
      </CardHeader>
      <CardContent>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeFilter === "all" ? "" : activeFilter} users
            </h3>
            <p className="text-gray-500">
              {activeFilter === "pending" 
                ? "No users are currently pending approval."
                : activeFilter === "admins"
                ? "No admin users found."
                : "No users found."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[120px]">Role</TableHead>
                  <TableHead className="min-w-[100px]">Extension</TableHead>
                  <TableHead className="min-w-[140px]">Created</TableHead>
                  <TableHead className="w-[60px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <Badge variant="outline" className="w-fit">{user.role}</Badge>
                        {/* {user.isAdmin && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 w-fit text-xs">
                            Admin
                          </Badge>
                        )} */}
                      </div>
                    </TableCell>
                    <TableCell>{user?.user_metadata?.extension || user.extension || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(user.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {/* Hide dropdown menu for current user to prevent self-modification */}
                      {user.id !== currentUser?.id ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-lg">
                          {/* Show admin options for all users */}
                          {!user.isAdmin ? (
                            <DropdownMenuItem
                              onClick={() => handlePromoteAdmin(user.id, true)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:text-blue-700 focus:bg-blue-50"
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handlePromoteAdmin(user.id, false)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 focus:text-orange-700 focus:bg-orange-50"
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remove Admin
                            </DropdownMenuItem>
                          )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="text-gray-400 text-xs">
                          <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-gray-500">
                            You
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

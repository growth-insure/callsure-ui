"use client";

import { UserManagement } from "@/components/admin/UserManagement";

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage user registrations and approvals</p>
      </div>
      
      <UserManagement />
    </div>
  );
}

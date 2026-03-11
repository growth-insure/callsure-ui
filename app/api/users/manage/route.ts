import { NextRequest, NextResponse } from "next/server";

type UpdateUserBody = {
  userId?: string;
  name?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type DeleteUserBody = {
  userId?: string;
};

const EMAIL_REGEX = /\S+@\S+\.\S+/;

function getConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { supabaseUrl, serviceRoleKey };
}

function getCurrentUserIdFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUserId = getCurrentUserIdFromHeader(request);
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const { userId, name, email, user_metadata }: UpdateUserBody = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    if (userId === currentUserId) {
      return NextResponse.json(
        { error: "Cannot modify your own account" },
        { status: 403 }
      );
    }

    const config = getConfig();
    if (!config) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const trimmedName = typeof name === "string" ? name.trim() : undefined;
    const trimmedEmail = typeof email === "string" ? email.trim() : undefined;

    if (trimmedName !== undefined && !trimmedName) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedEmail !== undefined && !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (trimmedEmail !== undefined) {
      updatePayload.email = trimmedEmail;
    }

    if (trimmedName !== undefined || user_metadata) {
      const metadata =
        user_metadata && typeof user_metadata === "object" ? { ...user_metadata } : {};

      if (trimmedName !== undefined) {
        metadata.name = trimmedName;
      }

      updatePayload.user_metadata = metadata;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update" },
        { status: 400 }
      );
    }

    const response = await fetch(`${config.supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        apikey: config.serviceRoleKey,
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update user:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to update user: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }

    const updatedUser = await response.json();

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      userId,
      timestamp: new Date().toISOString(),
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUserId = getCurrentUserIdFromHeader(request);
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const { userId }: DeleteUserBody = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    if (userId === currentUserId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 }
      );
    }

    const config = getConfig();
    if (!config) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const response = await fetch(`${config.supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        apikey: config.serviceRoleKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to delete user:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to delete user: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, isAdmin } = await request.json();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    // Extract current user ID from auth header
    const currentUserId = authHeader.replace('Bearer ', '');
    
    // Prevent self-modification
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: "Cannot modify your own account" },
        { status: 403 }
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }
    
    // console.log(`Promoting user ${userId} to admin: ${isAdmin}`);
    
    // Update user in Supabase auth.users
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        app_metadata: {
          isAdmin: isAdmin,
          role: isAdmin ? "super-admin" : "agent"
        },
        user_metadata: {
          role: isAdmin ? "super-admin" : "agent"
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to promote user:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to promote user: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }
    
    const updatedUser = await response.json();
    // console.log("User promoted successfully:", updatedUser);
    
    return NextResponse.json({
      success: true,
      message: `User ${isAdmin ? 'promoted to admin' : 'demoted from admin'} successfully`,
      userId,
      isAdmin,
      timestamp: new Date().toISOString(),
      user: updatedUser,
    });
    
  } catch (error) {
    console.error("Error promoting user:", error);
    return NextResponse.json(
      { error: `Failed to promote user` },
      { status: 500 }
    );
  }
}

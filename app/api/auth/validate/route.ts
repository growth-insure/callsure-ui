import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
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

    // Validate user exists and get current status
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Invalid token or user not found" },
        { status: 401 }
      );
    }

    const user = await response.json();
    
    // Check user status
    const appMetaData = user.app_metadata || {};
    const userMetadata = user.user_metadata || {};
    const status = appMetaData.status || userMetadata.status || "pending";
    
    // Return validation result
    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        status: status,
        isAdmin: appMetaData.isAdmin || false,
        role: appMetaData.role || userMetadata.role || "agent",
      },
    });

  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Token validation failed" },
      { status: 500 }
    );
  }
}

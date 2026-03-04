import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // console.log("=== Fetching users ===");
    
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    // console.log("Auth header:", authHeader ? "Present" : "Missing");
    
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    // console.log("Supabase URL:", supabaseUrl ? "Present" : "Missing");
    // console.log("Service Role Key:", serviceRoleKey ? "Present" : "Missing");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase configuration");
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    // Now using service role key to access auth.users via admin API
    // console.log("Fetching users from Supabase auth.users via admin API...");
    
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
      },
    });

    // console.log("Supabase admin API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase admin API error:", response.status, response.statusText);
      console.error("Error response body:", errorText);
      
      return NextResponse.json(
        { error: `Failed to fetch users from auth.users: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }

    type SupabaseUser = {
      id: string;
      email: string;
      created_at: string;
      raw_app_meta_data?: Record<string, unknown>;
      user_metadata?: Record<string, unknown>;
      app_metadata?: Record<string, unknown>;
    };

    const data = await response.json();
    const users: SupabaseUser[] = data.users ?? [];
    
    const getStringProp = (obj: Record<string, unknown>, key: string): string | undefined =>
      typeof obj[key] === "string" ? (obj[key] as string) : undefined;
    const getBooleanProp = (obj: Record<string, unknown>, key: string): boolean | undefined =>
      typeof obj[key] === "boolean" ? (obj[key] as boolean) : undefined;

    const processedUsers = users.map((user) => {
      const rawAppMetaData = (user.raw_app_meta_data as Record<string, unknown>) || {};
      const userMetadata = (user.user_metadata as Record<string, unknown>) || {};
      const appMetaData = (user.app_metadata as Record<string, unknown>) || {};

      // console.log(`User ${user.email}:`);
      // console.log(`  - raw_app_meta_data:`, rawAppMetaData);
      // console.log(`  - app_metadata:`, appMetaData);
      // console.log(`  - user_metadata:`, userMetadata);
      // console.log(`  - Full user object:`, user);

      // Try different metadata sources (prioritize app_metadata for admin roles)
      const role = getStringProp(appMetaData, "role") || getStringProp(userMetadata, "role") || "agent";
      const status =
        getStringProp(appMetaData, "status") ||
        getStringProp(userMetadata, "status") ||
        "pending";
      const isAdmin = getBooleanProp(appMetaData, "isAdmin") || false;
      
      // Admins/Super-admins are never pending - only agents can be pending
      const isPendingUser = (status === "pending" && (role === "agent" || !role));

      const nameFromMetadata =
        getStringProp(userMetadata, "name") ||
        (user.email ? user.email.split("@")[0] : "Unknown");

      return {
        id: user.id,
        email: user.email,
        name: nameFromMetadata,
        role: role,
        status: isPendingUser ? "pending" : (status || "pending"), // Use status from metadata or default to pending
        isAdmin: isAdmin,
        isPendingUser: isPendingUser, // Add flag for easy filtering
        createdAt: user.created_at,
        raw_app_meta_data: rawAppMetaData,
        app_metadata: appMetaData,
        user_metadata: userMetadata,
      };
    });

    // console.log("Processed users:", processedUsers);

    return NextResponse.json({
      users: processedUsers,
      total: processedUsers.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
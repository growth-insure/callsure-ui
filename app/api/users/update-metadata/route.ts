import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, app_metadata, user_metadata } = await request.json();

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

    // console.log(`Updating metadata for user ${userId}`);

    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        app_metadata: app_metadata,
        user_metadata: user_metadata
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update user metadata:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to update user metadata: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }

    const updatedUser = await response.json();
    // console.log("User metadata updated successfully:", updatedUser);

    return NextResponse.json({
      success: true,
      message: "User metadata updated successfully",
      userId,
      timestamp: new Date().toISOString(),
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error updating user metadata:", error);
    return NextResponse.json(
      { error: `Failed to update user metadata` },
      { status: 500 }
    );
  }
}

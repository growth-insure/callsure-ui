import { NextResponse } from "next/server";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase environment variables are missing.");
      return NextResponse.json(
        { message: "Password reset is unavailable right now. Please contact support." },
        { status: 500 }
      );
    }

    const redirectTo =
      process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT ||
      `${baseUrl}/reset-password`;
    const recoverUrl = `${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(
      redirectTo
    )}`;

    const response = await fetch(recoverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Supabase recover error:", errorBody);
      // Still return generic success to avoid email enumeration
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password handler error:", error);
    return NextResponse.json(
      {
        message:
          "We couldn't process your request right now. Please try again later.",
      },
      { status: 500 }
    );
  }
}


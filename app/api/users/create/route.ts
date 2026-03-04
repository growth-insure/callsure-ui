import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emailService";

// Generate a secure temporary password
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one character from each type
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special char
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, extension, role = "agent" } = await request.json();
    
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    // Extract current user ID from auth header
    const currentUserId = authHeader.replace('Bearer ', '');
    
    // Validate required fields
    if (!email || !name || !extension) {
      return NextResponse.json(
        { error: "Email, name, and extension are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["agent", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'agent' or 'admin'" },
        { status: 400 }
      );
    }

    // Validate extension
    if (!/^\d+$/.test(extension)) {
      return NextResponse.json(
        { error: "Extension must be a valid number" },
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
    
    // console.log(`Admin creating user: ${email} with role: ${role}`);
    
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Create user in Supabase auth.users using service role key
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        email: email,
        password: temporaryPassword,
        email_confirm: true, // Auto-confirm email (admin-created users are pre-verified)
        app_metadata: {
          role: role,
          isAdmin: role === "admin",
          createdBy: currentUserId,
          temporaryPassword: temporaryPassword
        },
        user_metadata: {
          name: name,
          role: role,
          extension: extension
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create user:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to create user: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }
    
    const createdUser = await response.json();
    // console.log("User created successfully:", createdUser);
    
    // Send welcome email with temporary password
    const emailSent = await sendWelcomeEmail({
      to: email,
      name: name,
      temporaryPassword: temporaryPassword,
      role: role,
      extension: extension
    });
    
    if (!emailSent) {
      console.warn("Failed to send welcome email, but user was created successfully");
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: name,
        extension: extension,
        role: role,
        status: "pending",
        emailSent: emailSent
      }
    });
    
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

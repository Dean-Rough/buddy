import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import bcrypt from "bcryptjs";

interface ChildProfile {
  name: string;
  age: number;
  username: string;
  pin: string;
}

interface CreateChildRequest {
  parentEmail: string;
  childProfile: ChildProfile;
  dashboardPin: string;
}

export async function POST(request: NextRequest) {
  try {
    const { parentEmail, childProfile, dashboardPin }: CreateChildRequest = await request.json();
    
    // Validate input
    if (!parentEmail || !childProfile || !dashboardPin) {
      return NextResponse.json(
        { error: "MISSING REQUIRED FIELDS!" },
        { status: 400 }
      );
    }

    if (!childProfile.name || !childProfile.username || !childProfile.pin) {
      return NextResponse.json(
        { error: "CHILD PROFILE INCOMPLETE!" },
        { status: 400 }
      );
    }

    if (childProfile.age < 6 || childProfile.age > 12) {
      return NextResponse.json(
        { error: "INVALID AGE RANGE!" },
        { status: 400 }
      );
    }

    if (childProfile.pin.length < 4) {
      return NextResponse.json(
        { error: "PIN TOO SHORT!" },
        { status: 400 }
      );
    }

    if (dashboardPin.length < 4) {
      return NextResponse.json(
        { error: "DASHBOARD PIN TOO SHORT!" },
        { status: 400 }
      );
    }

    // Check if username is already taken
    try {
      const existingUsers = await clerkClient.users.getUserList({
        query: childProfile.username.toLowerCase()
      });

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: "USERNAME ALREADY TAKEN! TRY ANOTHER" },
          { status: 409 }
        );
      }
    } catch (err) {
      console.error("Error checking username:", err);
      // Continue if we can't check - Clerk will handle the duplicate error
    }

    // Hash the dashboard PIN for the parent
    const dashboardPinHash = await bcrypt.hash(dashboardPin, 12);

    // Create child account in Clerk
    const childUser = await clerkClient.users.createUser({
      username: childProfile.username.toLowerCase(),
      password: childProfile.pin,
      firstName: childProfile.name,
      skipPasswordChecks: true, // Allow simple PIN as password
      unsafeMetadata: {
        userType: "child",
        age: childProfile.age,
        parentEmail: parentEmail.toLowerCase(),
        persona: "friendly-raccoon",
        languageLevel: "foundation",
        visibilityLevel: "highlights",
        accountStatus: "active"
      },
      publicMetadata: {
        userType: "child"
      }
    });

    console.log("Child user created:", {
      id: childUser.id,
      username: childUser.username,
      parentEmail
    });

    return NextResponse.json({
      success: true,
      childUserId: childUser.id,
      username: childProfile.username,
      dashboardPinHash,
      message: "CHILD ACCOUNT CREATED SUCCESSFULLY!"
    });

  } catch (error: any) {
    console.error("Child account creation error:", error);
    
    // Map Clerk errors to user-friendly messages
    if (error.errors) {
      const clerkError = error.errors[0];
      
      if (clerkError.code === "form_identifier_exists") {
        return NextResponse.json(
          { error: "USERNAME ALREADY TAKEN! TRY ANOTHER" },
          { status: 409 }
        );
      }
      
      if (clerkError.code === "form_password_pwned") {
        return NextResponse.json(
          { error: "PIN TOO COMMON! CHOOSE A DIFFERENT ONE" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: clerkError.message || "ACCOUNT CREATION FAILED!" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "ACCOUNT CREATION FAILED! TRY AGAIN" },
      { status: 500 }
    );
  }
}
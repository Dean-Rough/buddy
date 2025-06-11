import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createChildProfile, getChildProfiles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get parent record
    const parent = await prisma.parent.findUnique({
      where: { clerkUserId: userId },
    });
    
    if (!parent) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 404 }
      );
    }
    
    const children = await getChildProfiles(parent.id);
    
    return NextResponse.json({ children });
    
  } catch (error) {
    console.error("Get children error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { name, age, pin } = await request.json();
    
    if (!name || !age || !pin) {
      return NextResponse.json(
        { error: "Name, age, and PIN are required" },
        { status: 400 }
      );
    }
    
    if (age < 6 || age > 12) {
      return NextResponse.json(
        { error: "Age must be between 6 and 12" },
        { status: 400 }
      );
    }
    
    if (pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }
    
    // Get or create parent record
    let parent = await prisma.parent.findUnique({
      where: { clerkUserId: userId },
    });
    
    if (!parent) {
      // Create parent record - get email from Clerk
      const { currentUser } = await import("@clerk/nextjs/server");
      const user = await currentUser();
      
      parent = await prisma.parent.create({
        data: {
          clerkUserId: userId,
          email: user?.emailAddresses[0]?.emailAddress || "",
        },
      });
    }
    
    const child = await createChildProfile(parent.id, name, age, pin);
    
    return NextResponse.json({
      success: true,
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
      },
    });
    
  } catch (error) {
    console.error("Create child error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { verifyChildPin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    
    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { error: "PIN must be at least 4 digits" },
        { status: 400 }
      );
    }
    
    const child = await verifyChildPin(pin);
    
    if (!child) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }
    
    // Create a session token for the child
    const sessionToken = btoa(JSON.stringify({
      childId: child.id,
      parentId: child.parentId,
      timestamp: Date.now(),
    }));
    
    return NextResponse.json({
      success: true,
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
      },
      sessionToken,
    });
    
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
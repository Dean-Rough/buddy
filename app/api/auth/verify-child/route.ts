import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', userType: null },
        { status: 401 }
      );
    }

    // Get current user details
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'USER NOT FOUND', userType: null },
        { status: 404 }
      );
    }

    // Check user type from metadata
    const userType =
      user.publicMetadata?.userType || user.unsafeMetadata?.userType;

    if (userType === 'child') {
      // Verify this is actually a child account in our database
      const childAccount = await prisma.childAccount.findUnique({
        where: { clerkUserId: userId },
        select: {
          id: true,
          name: true,
          age: true,
          accountStatus: true,
          parentClerkUserId: true,
        },
      });

      if (!childAccount) {
        return NextResponse.json(
          {
            error: 'CHILD ACCOUNT NOT FOUND IN DATABASE',
            userType: 'child',
            isValid: false,
          },
          { status: 404 }
        );
      }

      if (childAccount.accountStatus !== 'active') {
        return NextResponse.json(
          {
            error: 'CHILD ACCOUNT IS NOT ACTIVE',
            userType: 'child',
            isValid: false,
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        userType: 'child',
        isValid: true,
        childAccount: {
          id: childAccount.id,
          name: childAccount.name,
          age: childAccount.age,
          parentClerkUserId: childAccount.parentClerkUserId,
        },
      });
    }

    if (userType === 'parent') {
      return NextResponse.json({
        userType: 'parent',
        isValid: true,
        message: 'PARENT ACCOUNT VERIFIED',
      });
    }

    // Unknown or missing user type
    return NextResponse.json(
      {
        error: 'UNKNOWN USER TYPE',
        userType: userType || 'unknown',
        isValid: false,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Child verification error:', error);
    return NextResponse.json(
      { error: 'VERIFICATION FAILED', userType: null },
      { status: 500 }
    );
  }
}
